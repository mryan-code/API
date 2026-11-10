import path from "path";
import type {
	ChatHistoryItem,
	LlamaChatSession,
	LlamaContext,
	LlamaContextSequence,
	LlamaModel,
} from "node-llama-cpp";
import { loadLlamaCpp } from "../loaders/llama";
import * as models from "../models";
import * as functions from "./index";
import * as types from "../types";
import { KokoroTTS } from "kokoro-js";

// Resident LLM chat sessions.
//
// Before this module, every /chat call loaded the model, created a fresh
// context, answered a single prompt and threw it all away, so the model had
// no memory of the conversation and paid the full load + evaluation cost on
// every request.
//
// Sessions now stay warm in memory:
// - /load (or the first /chat) creates a session once, keyed by
//   "user_id:conversation" — the conversation name doubles as the
//   tbluser_conversation_subject.subject the transcript is stored under,
//   and defaults to "main" (mirroring the frontend's WSS channel names).
// - The model itself is loaded once and shared; each session owns its own
//   context + sequence, so its KV cache stays warm between requests.
// - Prompts on one session are serialized through a per-session promise
//   queue: a sequence cannot run two generations at the same time.
// - Every exchange is persisted to tbluser_conversation_content. When a
//   session is (re)created, the stored transcript is replayed into the new
//   session with setChatHistory, so a restart or an eviction costs one
//   re-evaluation, not the conversation.
// - Sessions idle longer than the TTL are evicted and their sequence and
//   context disposed, so abandoned chats cannot leak GPU/RAM over time.

interface LlmSessionEntry {
	key: string;
	user_id: number;
	conversation: string;
	subject_id: number;
	session: LlamaChatSession;
	context: LlamaContext;
	sequence: LlamaContextSequence;
	created_at: Date;
	last_used: number;
	queue: Promise<unknown>;
}

const sessions = new Map<string, LlmSessionEntry>();
const pendingSessions = new Map<string, Promise<LlmSessionEntry>>();

let sharedModel: LlamaModel | null = null;
let sharedModelPromise: Promise<LlamaModel> | null = null;
let sweeperStarted = false;

const SESSION_TTL_MS =
	(parseInt(process.env.LLM_SESSION_TTL_MINUTES || "30", 10) || 30) *
	60 *
	1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
// Bounds the rebuild cost when a session is recreated from its transcript.
const HISTORY_REBUILD_LIMIT = 40;

function llmSessionKey(user_id: number, conversation: string): string {
	return user_id.toString() + ":" + conversation;
}

function hasLlmSession(key: string): boolean {
	return sessions.has(key);
}

async function getSharedModel(): Promise<LlamaModel> {
	if (sharedModel) {
		return sharedModel;
	}
	if (!sharedModelPromise) {
		sharedModelPromise = (async () => {
			const { getLlama } = await loadLlamaCpp();
			const llama = await getLlama();
			sharedModel = await llama.loadModel({
				modelPath: path.join(
					process.env.MODEL_PATH || "",
					process.env.BASE_MODEL || "",
				),
			});
			return sharedModel;
		})();
	}
	return sharedModelPromise;
}

async function findOrCreateSubjectId(
	user_id: number,
	conversation: string,
): Promise<number> {
	const existing = await models.UserConversationSubject.findOne({
		where: { user_id: user_id, subject: conversation, deleted: 0 },
	});
	if (existing) {
		return existing.id;
	}
	const created = await models.UserConversationSubject.create({
		user_id: user_id,
		subject: conversation,
	});
	return created.id;
}

async function loadHistoryItems(
	subject_id: number,
): Promise<ChatHistoryItem[]> {
	const rows = await models.UserConversationContent.findAll({
		where: { user_conversation_subject_id: subject_id, deleted: 0 },
		order: [
			["created", "DESC"],
			["id", "DESC"],
		],
		limit: HISTORY_REBUILD_LIMIT,
	});
	rows.reverse();
	const history: ChatHistoryItem[] = [];
	for (const row of rows) {
		if (row.prompt) {
			history.push({ type: "user", text: row.prompt });
		}
		if (row.response) {
			history.push({ type: "model", response: [row.response] });
		}
	}
	return history;
}

// The global rules are the session's system prompt, snapshotted when the
// session is created: a rule edited mid-conversation applies from the next
// session (or the next rebuild), not retroactively to a warm one.
async function loadSystemPrompt(): Promise<string> {
	const rules = await models.GlobalRule.findAll({
		where: { deleted: 0 },
		order: [["created", "ASC"]],
	});
	return rules
		.map(row => (row.rule || "").trim())
		.filter(text => text.length > 0)
		.join("\n");
}
async function createLlmSession(
	key: string,
	user_id: number,
	conversation: string,
): Promise<LlmSessionEntry> {
	const subject_id = await findOrCreateSubjectId(user_id, conversation);
	const model = await getSharedModel();
	const context = await model.createContext();
	const sequence = context.getSequence();
	const { LlamaChatSession } = await loadLlamaCpp();
	const session = new LlamaChatSession({
		contextSequence: sequence,
	});
	const systemPrompt = await loadSystemPrompt();
	const history = await loadHistoryItems(subject_id);
	const fullHistory: ChatHistoryItem[] = [];
	if (systemPrompt) {
		fullHistory.push({ type: "system", text: systemPrompt });
	}
	fullHistory.push(...history);
	if (fullHistory.length > 0) {
		session.setChatHistory(fullHistory);
	}
	const entry: LlmSessionEntry = {
		key: key,
		user_id: user_id,
		conversation: conversation,
		subject_id: subject_id,
		session: session,
		context: context,
		sequence: sequence,
		created_at: new Date(),
		last_used: Date.now(),
		queue: Promise.resolve(),
	};
	sessions.set(key, entry);
	startSweeper();
	return entry;
}

async function getOrCreateLlmSession(
	user_id: number,
	conversation: string,
): Promise<LlmSessionEntry> {
	const key = llmSessionKey(user_id, conversation);
	const existing = sessions.get(key);
	if (existing) {
		existing.last_used = Date.now();
		return existing;
	}
	let pending = pendingSessions.get(key);
	if (!pending) {
		pending = createLlmSession(key, user_id, conversation).finally(() => {
			pendingSessions.delete(key);
		});
		pendingSessions.set(key, pending);
	}
	return pending;
}

// Prompts are serialized per session, and each completed exchange is
// persisted so the transcript survives restarts and evictions.
async function promptLlmSession(
	entry: LlmSessionEntry,
	promptText: string,
): Promise<string> {
	const run = entry.queue.then(async () => {
		const answer = await entry.session.prompt(promptText);
		entry.last_used = Date.now();
		try {
			await models.UserConversationContent.create({
				user_id: entry.user_id,
				user_conversation_subject_id: entry.subject_id,
				prompt: promptText,
				response: answer,
			});
		} catch (error) {
			// A failed transcript write must not fail the chat itself.
			console.error(
				"llmSessions: failed to persist conversation content",
				error,
			);
		}
		return answer;
	});
	// Keep the queue alive even when a prompt fails.
	entry.queue = run.catch(() => undefined);
	return run;
}

async function disposeLlmSession(key: string): Promise<boolean> {
	const entry = sessions.get(key);
	if (!entry) {
		return false;
	}
	sessions.delete(key);
	try {
		await entry.sequence.dispose();
	} catch {
		// Already disposed or mid-generation; the entry is dropped either way.
	}
	try {
		await entry.context.dispose();
	} catch {
		// Same as above.
	}
	return true;
}

function startSweeper() {
	if (sweeperStarted) {
		return;
	}
	sweeperStarted = true;
	const timer = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of sessions) {
			if (now - entry.last_used > SESSION_TTL_MS) {
				void disposeLlmSession(key);
			}
		}
	}, SWEEP_INTERVAL_MS);
	timer.unref();
}
async function chat(context: types.HttpContext): Promise<types.HttpContext> {
	context = functions.initializeContext(context);
	if (await functions.verifyJWT(context.user_jwt)) {
		const decodedToken: types.KeyValue | undefined =
			await functions.decodeJWT(context.user_jwt);
		const parameters: types.KeyValue = {};
		if (decodedToken?.user_id && context.prompt) {
			const returnObject: types.KeyValue = {};
			returnObject.prompt = context.prompt;
			context.user_id = decodedToken.user_id;
			parameters.user_id = context.user_id;
			parameters.prompt = context.parameters.prompt;
			// parameters.power = JSON.parse(this.parameters.power || "false");
			// parameters.tts = JSON.parse(this.parameters.tts || "false");
			// parameters.enable_thinking = JSON.parse(
			// 	this.parameters.enable_thinking || "false",
			// );
			// const response = await functions.apiRequest(
			// 	this,
			// 	"POST",
			// 	"http://" +
			// 		process.env.LLM_HOST +
			// 		":" +
			// 		process.env.LLM_PORT,
			// 	"/chat",
			// 	parameters,
			// 	parseInt(process.env.LLM_TIMEOUT || "0"),
			// );
			// this.success = response?.status === "success" ? true : false;
			// if (response?.message) {
			// 	this.message.push(
			// 		...(Array.isArray(response.message)
			// 			? response.message
			// 			: [response.message]),
			// 	);
			// }
			// if (
			// 	response?.response ||
			// 	(response?.media?.mime_type && response?.media?.base64)
			// ) {
			// 	this.success = true;

			// 	const promptID = await this.insertPrompt(
			// 		this.parameters.prompt,
			// 		response?.response || "",
			// 		response?.media?.mime_type || "",
			// 		response?.media?.base64 || "",
			// 	);
			// 	if (promptID) {
			// 		response.prompt_id = promptID;
			// 	}
			// 	this.results = [response];
			// }
			// if (response?.queries && Array.isArray(response.queries)) {
			// 	this.queries.push(...response.queries);
			// }
			// if (response?.parameters) {
			// 	this.parameters = {
			// 		...this.parameters,
			// 		...response.parameters,
			// 	};
			// }

			// get all rules
			const sequelizeOptions: types.KeyValue = {
				subQuery: false,
				attributes: {
					include: [
						[
							"id",
							(await functions.renameDialerObject(
								models.GlobalRule.name.trim(),
								false,
							)) + "_id",
						],
					],
					exclude: ["id"],
				},
				where: {
					deleted: 0,
				},
				order: context.order,
				logging: (sql: string) => {
					context.queries.push(sql.toString());
					if (globalThis.globalVars.DEBUG_USER === "mryan") {
						console.log("sql", sql.toString());
					}
				},
			};
			const rules = await models.GlobalRule.findAll(sequelizeOptions);
			console.log("rules", rules);
			returnObject.rules = rules;

			// Prompt the resident session for this user + conversation.
			// The session is created by /load (or lazily here) and stays
			// warm between requests, so the model keeps the conversation
			// in its context instead of starting over on every call.
			// See functions/llmSessions.
			const conversation: string = (
				context.conversation ||
				context.subject ||
				"main"
			)
				.toString()
				.slice(0, 100);
			const entry = await functions.getOrCreateLlmSession(
				Number(context.user_id),
				conversation,
			);
			const response = await functions.promptLlmSession(
				entry,
				context.parameters.prompt,
			);
			returnObject.conversation = conversation;
			returnObject.session_key = entry.key;

			returnObject.answer = response;
			console.log("AI:", response);
			context.results = [returnObject];
			context.success = true;
		} else {
			context.success = false;
			context.message.push(
				"Invalid parameters: user_id and prompt are required.",
			);
		}
	}
	return await functions.sendContext(context);
}

async function tts(
	context: types.HttpContext,
	text: string,
	voiceOption:
		| "af_heart"
		| "af_alloy"
		| "af_aoede"
		| "af_bella"
		| "af_jessica"
		| "af_kore"
		| "af_nicole"
		| "af_nova"
		| "af_river"
		| "af_sarah"
		| "af_sky"
		| "am_adam"
		| "am_echo"
		| "am_eric"
		| "am_fenrir"
		| "am_liam"
		| "am_michael"
		| "am_onyx"
		| "am_puck"
		| "am_santa" = "af_heart",
): Promise<types.HttpContext> => {
	if (!process.env.TTS_MODEL) {
		context.success = false;
		context.message.push("TTS model not found");
		return await functions.sendContext(context);
	}
	const tts = await KokoroTTS.from_pretrained(process.env.TTS_MODEL, {
		dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
		device: "wasm", // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
	});

	const audio = await tts.generate(text, {
		// Use `tts.list_voices()` to list all available voices
		voice: voiceOption,
	});
	// return base64 and mime_type
	const base64 = Buffer.from(audio.audio).toString("base64");
	const mime_type = "audio/wav";
	const ttsObject: types.KeyValue = {
		audio: audio,
		mime_type: mime_type,
		base64: base64,
	};
	context.results = { tts: ttsObject };
	context.success = true;
	return await functions.sendContext(context);
}

export {
	llmSessionKey,
	hasLlmSession,
	getOrCreateLlmSession,
	promptLlmSession,
	disposeLlmSession,
	chat,
	tts,
};
export type { LlmSessionEntry };
