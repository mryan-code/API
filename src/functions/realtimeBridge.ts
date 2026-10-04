import WebSocket from "ws";
import { isJSON } from "../validation/isJSON";
import { decodeJWT, verifyJWT } from "./JWT";

// A socket the browser or the LLM realtime endpoint can send on.
type RealtimeSocket = {
	readyState: number;
	send: (data: any, options?: { binary?: boolean }) => void;
	close: () => void;
	on: (
		event: string,
		listener: (...args: any[]) => void | Promise<void>,
	) => void;
};

type RealtimeLink = {
	browser: RealtimeSocket;
	upstream: RealtimeSocket;
};

// One live camera session per user. A new start closes the previous browser socket.
const realtimeLinks = new Map<string, RealtimeLink>();

const llmRealtimeTls = function (): boolean {
	const value = (process.env.LLM_REALTIME_TLS || "").trim().toLowerCase();
	return value === "1" || value === "true" || value === "yes" || value === "on";
};

const llmRealtimeUrl = function (): string | null {
	const host = process.env.LLM_HOST;
	if (!host) {
		return null;
	}
	const llmPort = parseInt(process.env.LLM_PORT || "8765", 10);
	const realtimePort = process.env.LLM_REALTIME_PORT
		? parseInt(process.env.LLM_REALTIME_PORT, 10)
		: llmPort + 1;
	const scheme = llmRealtimeTls() ? "wss" : "ws";
	return scheme + "://" + host + ":" + String(realtimePort) + "/realtime";
};

const waitUntilOpen = function (socket: RealtimeSocket): Promise<void> {
	if (socket.readyState === WebSocket.OPEN) {
		return Promise.resolve();
	}
	return new Promise((resolve, reject) => {
		socket.on("open", () => {
			resolve();
		});
		socket.on("error", (error: unknown) => {
			reject(error instanceof Error ? error : new Error("socket error"));
		});
	});
};

const sendJson = function (socket: RealtimeSocket, payload: Record<string, unknown>): void {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(payload));
	}
};

// High-risk: forwards live camera frames and microphone audio to the LLM.
// The user JWT is checked here and is not included in the upstream start message.
const attachRealtimeBridge = async function (
	browserSocket: RealtimeSocket,
	connect: (url: string) => RealtimeSocket = (url) =>
		// The upstream dial is loopback-only; the cert CN does not match 127.0.0.1, so skip chain verification there.
		new WebSocket(
			url,
			llmRealtimeTls() ? { rejectUnauthorized: false } : undefined,
		) as unknown as RealtimeSocket,
): Promise<void> {
	let upstream: RealtimeSocket | null = null;
	let userKey = "";
	let started = false;

	const closeUpstream = function (): void {
		if (upstream && upstream.readyState === WebSocket.OPEN) {
			upstream.send(JSON.stringify({ type: "stop" }));
			upstream.close();
		}
	};

	browserSocket.on("close", () => {
		if (userKey) {
			const current = realtimeLinks.get(userKey);
			if (current && current.browser === browserSocket) {
				realtimeLinks.delete(userKey);
			}
		}
		closeUpstream();
	});

	browserSocket.on("message", async (data: unknown, isBinary: boolean) => {
		if (!started) {
			if (isBinary) {
				sendJson(browserSocket, {
					type: "error",
					error: "session has not started",
				});
				return;
			}
			const text = Buffer.isBuffer(data)
				? data.toString("utf8")
				: String(data);
			if (!isJSON(text)) {
				sendJson(browserSocket, {
					type: "error",
					error: "invalid JSON",
				});
				browserSocket.close();
				return;
			}
			const message = JSON.parse(text);
			if (message.type === "stop") {
				browserSocket.close();
				return;
			}
			if (message.type !== "start" || !message.user_jwt) {
				sendJson(browserSocket, {
					type: "error",
					error: "user_jwt is required",
				});
				browserSocket.close();
				return;
			}
			const verified = await verifyJWT(message.user_jwt);
			if (!verified) {
				sendJson(browserSocket, {
					type: "error",
					error: "unauthorized",
				});
				browserSocket.close();
				return;
			}
			const decoded = await decodeJWT(message.user_jwt);
			if (
				decoded?.user_id === undefined ||
				decoded?.user_id === null ||
				decoded?.user_id === ""
			) {
				sendJson(browserSocket, {
					type: "error",
					error: "unauthorized",
				});
				browserSocket.close();
				return;
			}
			const url = llmRealtimeUrl();
			if (!url) {
				sendJson(browserSocket, {
					type: "error",
					error: "LLM host is not configured",
				});
				browserSocket.close();
				return;
			}
			let nextUpstream: RealtimeSocket;
			try {
				nextUpstream = connect(url);
			} catch (error) {
				sendJson(browserSocket, {
					type: "error",
					error: "LLM realtime socket failed",
				});
				browserSocket.close();
				return;
			}
			upstream = nextUpstream;
			nextUpstream.on(
				"message",
				(upstreamData: unknown, upstreamBinary: boolean) => {
					if (browserSocket.readyState === WebSocket.OPEN) {
						browserSocket.send(upstreamData, {
							binary: upstreamBinary,
						});
					}
				},
			);
			nextUpstream.on("close", () => {
				if (browserSocket.readyState === WebSocket.OPEN) {
					browserSocket.close();
				}
			});
			nextUpstream.on("error", () => {
				sendJson(browserSocket, {
					type: "error",
					error: "LLM realtime socket failed",
				});
				if (browserSocket.readyState === WebSocket.OPEN) {
					browserSocket.close();
				}
			});
			try {
				await waitUntilOpen(nextUpstream);
			} catch (error) {
				sendJson(browserSocket, {
					type: "error",
					error: "LLM realtime socket failed",
				});
				browserSocket.close();
				return;
			}
			userKey = String(decoded.user_id);
			const previous = realtimeLinks.get(userKey);
			realtimeLinks.set(userKey, {
				browser: browserSocket,
				upstream: nextUpstream,
			});
			if (previous && previous.browser !== browserSocket) {
				previous.browser.close();
			}
			// user_jwt stays on this process. The LLM session only receives user_id.
			nextUpstream.send(
				JSON.stringify({
					type: "start",
					user_id: decoded.user_id,
				}),
			);
			started = true;
			return;
		}
		if (!upstream || upstream.readyState !== WebSocket.OPEN) {
			return;
		}
		upstream.send(data, { binary: isBinary });
	});
};

export { attachRealtimeBridge, llmRealtimeUrl };
export type { RealtimeSocket };
