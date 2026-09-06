import { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import * as models from "../models";
import moment from "moment";
import { Op, Sequelize } from "sequelize";
import { getChalk } from "../functions/getChalk";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { loadEnv } from "../functions/loadEnv";
import { snapshotDownload, listModels } from "@huggingface/hub";
import { readFileSync } from "node:fs";
import { unlink } from "node:fs/promises";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

const chalk = getChalk();
import util from "util";

loadEnv();

class LLMAction extends GenericAction {
	// apiRequest = async (
	// 	method: string,
	// 	path: string,
	// 	parameters: types.KeyValue | FormData = {},
	// 	timeout: number = 0,
	// ): Promise<any> => {
	// 	const api = axios.create({
	// 		baseURL: process.env.LLM_HOST + ":" + process.env.LLM_PORT + "/",
	// 		timeout: timeout,
	// 	});

	// 	if (api !== undefined) {
	// 		const axiosConfig: types.KeyValue = {};
	// 		const headers: types.KeyValue = {};
	// 		headers["Content-Type"] = "application/json";

	// 		axiosConfig.headers = headers;

	// 		const env: types.KeyValue = {};
	// 		env.GLOBAL_DEBUG_LEVEL = process.env.GLOBAL_DEBUG_LEVEL;
	// 		env.DEBUG_USER = process.env.DEBUG_USER;
	// 		// Keep env metadata on both JSON and multipart payloads while avoiding unsafe union property access.
	// 		if (parameters instanceof FormData) {
	// 			parameters.append("env", JSON.stringify(env));
	// 		} else {
	// 			parameters.env = env;
	// 		}

	// 		axiosConfig.method = method.toUpperCase();
	// 		axiosConfig.url = path;
	// 		if (method.toUpperCase() !== "GET") {
	// 			axiosConfig.data = parameters as types.KeyValue;
	// 		}
	// 		// switch (method) {
	// 		// 	case "POST":
	// 		// 		axiosConfig.method = method.toUpperCase();
	// 		// 		axiosConfig.url = path;
	// 		// 		axiosConfig.data = parameters as types.KeyValue;
	// 		// 		break;
	// 		// 	case "PUT":
	// 		// 		axiosConfig.method = method.toUpperCase();
	// 		// 		axiosConfig.url = path;
	// 		// 		axiosConfig.data = parameters as types.KeyValue;
	// 		// 		break;
	// 		// 	case "DELETE":
	// 		// 		axiosConfig.method = method.toUpperCase();
	// 		// 		axiosConfig.url = path;
	// 		// 		axiosConfig.data = parameters as types.KeyValue;
	// 		// 		break;
	// 		// 	case "GET":
	// 		// 		axiosConfig.method = method.toUpperCase();
	// 		// 		axiosConfig.url = path;
	// 		// 		break;
	// 		// 	default:
	// 		// 		break;
	// 		// }
	// 		// axiosConfig.method = method;
	// 		// axiosConfig.url = path;
	// 		// axiosConfig.data = parameters;
	// 		const response = await api
	// 			?.request(axiosConfig)
	// 			.then(async response => {
	// 				// console.log("API response", JSON.parse(JSON.stringify(response)));
	// 				let responseData = response.data;
	// 				if (
	// 					typeof responseData === "string" &&
	// 					validation.isJSON(responseData)
	// 				) {
	// 					responseData = JSON.parse(responseData);
	// 				}
	// 				return responseData;
	// 			})
	// 			.catch(async (error: any): Promise<any> => {
	// 				console.error("LLM API request error: ", error);
	// 				const errorMessage = [];
	// 				if (error.message) {
	// 					errorMessage.push(error.message);
	// 					this.message.push(error.message);
	// 				}
	// 				if (error.response) {
	// 					if (error.response.data) {
	// 						if (error.response.data.message) {
	// 							for (const message of error.response.data
	// 								.message) {
	// 								errorMessage.push(message);
	// 								this.message.push(message);
	// 							}
	// 						}
	// 					}
	// 				}
	// 				return { success: false, message: errorMessage };
	// 			});
	// 		return response;
	// 	} else {
	// 		return { success: false };
	// 	}
	// };

	// af_heart	🚺❤️			A
	// af_alloy	🚺	B	MM minutes	C
	// af_aoede	🚺	B	H hours	C+
	// af_bella	🚺🔥	A	HH hours	A-
	// af_jessica	🚺	C	MM minutes	D
	// af_kore	🚺	B	H hours	C+
	// af_nicole	🚺🎧	B	HH hours	B-
	// af_nova	🚺	B	MM minutes	C
	// af_river	🚺	C	MM minutes	D
	// af_sarah	🚺	B	H hours	C+
	// af_sky	🚺	B	M minutes 🤏	C-
	// am_adam	🚹	D	H hours	F+
	// am_echo	🚹	C	MM minutes	D
	// am_eric	🚹	C	MM minutes	D
	// am_fenrir	🚹	B	H hours	C+
	// am_liam	🚹	C	MM minutes	D
	// am_michael	🚹	B	H hours	C+
	// am_onyx	🚹	C	MM minutes	D
	// am_puck	🚹	B	H hours	C+
	// am_santa	🚹	C	M minutes 🤏	D-

	task = async (): Promise<any> => {
		const pathTask: string = this.req.path.toString().replace("/", "");

		switch (pathTask) {
			case "health":
				await this.health();
				break;
			case "chat":
				await this.chat();
				break;
			case "system-model":
				await this.systemModel();
				break;
			case "custom-model":
				await this.customModel();
				break;
			case "download-model":
				await this.downloadModel();
				break;
			case "search-models":
				await this.listModels();
				break;
			case "add-global-rule":
				await this.addGlobalRule();
				break;
			case "save-global-rule":
				await this.saveGlobalRule();
				break;
			case "get-global-rule":
				await this.getGlobalRule();
				break;
			case "delete-global-rule":
				await this.deleteGlobalRule();
				break;
			case "add-model-type":
				await this.addModelType();
				break;
			case "save-model-type":
				await this.saveModelType();
				break;
			case "get-model-type":
				await this.getModelType();
				break;
			case "delete-model-type":
				await this.deleteModelType();
				break;
			case "add-user-p2":
				await this.addUserP2();
				break;
			case "save-user-p2":
				await this.saveUserP2();
				break;
			case "get-user-p2":
				await this.getUserP2();
				break;
			case "delete-user-p2":
				await this.deleteUserP2();
				break;
			case "add-user-conversation-subject":
				await this.addUserConversationSubject();
				break;
			case "save-user-conversation-subject":
				await this.saveUserConversationSubject();
				break;
			case "get-user-conversation-subject":
				await this.getUserConversationSubject();
				break;
			case "delete-user-conversation-subject":
				await this.deleteUserConversationSubject();
				break;
			case "get-user-conversation":
				await this.getUserConversation();
				break;
			case "add-user-conversation-content":
				await this.addUserConversationContent();
				break;
			case "save-user-conversation-content":
				await this.saveUserConversationContent();
				break;
			case "get-user-conversation-content":
				await this.getUserConversationContent();
				break;
			case "delete-user-conversation-content":
				await this.deleteUserConversationContent();
				break;
			case "add-user-guideline":
				await this.addUserGuideline();
				break;
			case "save-user-guideline":
				await this.saveUserGuideline();
				break;
			case "get-user-guideline":
				await this.getUserGuideline();
				break;
			case "delete-user-guideline":
				await this.deleteUserGuideline();
				break;
			case "add-user-avatar":
				await this.addUserAvatar();
				break;
			case "save-user-avatar":
				await this.saveUserAvatar();
				break;
			case "get-user-avatar":
				await this.getUserAvatar();
				break;
			case "delete-user-avatar":
				await this.deleteUserAvatar();
				break;
			case "get-avatar-voice":
				await this.getAvatarVoice();
				break;
			case "get-user-chat":
				await this.getUserChat();
				break;
			default:
				throw new Error("Invalid Task: " + pathTask);
				break;
		}
	};

	health = async () => {
		const response = await functions.apiRequest(
			this,
			"GET",
			"http://" + process.env.LLM_HOST + ":" + process.env.LLM_PORT,
			"/health",
			{},
			parseInt(process.env.LLM_TIMEOUT || "0"),
		);
		this.success = response?.status === "ok" ? true : false;
		if (response?.message) {
			this.message.push(
				...(Array.isArray(response.message)
					? response.message
					: [response.message]),
			);
		}
		this.results = [response];
	};
	chat = async () => {
		if (await functions.verifyJWT(this.parameters.user_jwt)) {
			const decodedToken: types.KeyValue | undefined =
				await functions.decodeJWT(this.parameters.user_jwt);
			const parameters: types.KeyValue = {};
			if (decodedToken?.user_id && this.parameters.prompt) {
				this.parameters.user_id = decodedToken.user_id;
				parameters.user_id = this.parameters.user_id;
				parameters.prompt = this.parameters.prompt;
				parameters.power = JSON.parse(this.parameters.power || "false");
				parameters.tts = JSON.parse(this.parameters.tts || "false");
				parameters.enable_thinking = JSON.parse(
					this.parameters.enable_thinking || "false",
				);
				const response = await functions.apiRequest(
					this,
					"POST",
					"http://" +
						process.env.LLM_HOST +
						":" +
						process.env.LLM_PORT,
					"/chat",
					parameters,
					parseInt(process.env.LLM_TIMEOUT || "0"),
				);
				this.success = response?.status === "success" ? true : false;
				if (response?.message) {
					this.message.push(
						...(Array.isArray(response.message)
							? response.message
							: [response.message]),
					);
				}
				if (
					response?.response ||
					(response?.media?.mime_type && response?.media?.base64)
				) {
					this.success = true;

					const promptID = await this.insertPrompt(
						this.parameters.prompt,
						response?.response || "",
						response?.media?.mime_type || "",
						response?.media?.base64 || "",
					);
					if (promptID) {
						response.prompt_id = promptID;
					}
					this.results = [response];
				}
				if (response?.queries && Array.isArray(response.queries)) {
					this.queries.push(...response.queries);
				}
				if (response?.parameters) {
					this.parameters = {
						...this.parameters,
						...response.parameters,
					};
				}
			} else {
				this.success = false;
				this.message.push(
					"Invalid parameters: user_id and prompt are required.",
				);
			}
		}
	};
	systemModel = async () => {
		if (await functions.verifyJWT(this.parameters.user_jwt)) {
			const decodedToken: types.KeyValue | undefined =
				await functions.decodeJWT(this.parameters.user_jwt);
			const parameters: types.KeyValue = {};
			if (decodedToken?.user_id && this.parameters.prompt) {
				this.parameters.user_id = decodedToken.user_id;
				parameters.user_id = this.parameters.user_id;
				parameters.prompt = this.parameters.prompt;
				parameters.type = "system";
				parameters.tts = JSON.parse(this.parameters.tts || "false");
				parameters.model = this.parameters.model;
				const response = await functions.apiRequest(
					this,
					"POST",
					"http://" +
						process.env.LLM_HOST +
						":" +
						process.env.LLM_PORT,
					"/use-model",
					parameters,
					parseInt(process.env.LLM_TIMEOUT || "0"),
				);
				this.success = response?.status === "success" ? true : false;
				if (
					response?.response ||
					(response?.media?.mime_type && response?.media?.base64)
				) {
					this.success = true;
					this.results = [response];
					await this.insertPrompt(
						this.parameters.prompt,
						response?.response || "",
						response?.media?.mime_type || "",
						response?.media?.base64 || "",
					);
				}
				if (response?.message) {
					this.message.push(
						...(Array.isArray(response.message)
							? response.message
							: [response.message]),
					);
				}
				if (response?.parameters) {
					this.parameters = {
						...this.parameters,
						...response.parameters,
					};
				}
				if (response?.queries && Array.isArray(response.queries)) {
					this.queries.push(...response.queries);
				}
			} else {
				this.success = false;
				this.message.push(
					"Invalid parameters: user_id and prompt are required.",
				);
			}
		}
	};
	customModel = async () => {
		if (await functions.verifyJWT(this.parameters.user_jwt)) {
			const decodedToken: types.KeyValue | undefined =
				await functions.decodeJWT(this.parameters.user_jwt);
			const parameters: types.KeyValue = {};
			if (decodedToken?.user_id && this.parameters.prompt) {
				this.parameters.user_id = decodedToken.user_id;
				parameters.user_id = this.parameters.user_id;
				parameters.prompt = this.parameters.prompt;
				parameters.type = "system";
				parameters.tts = JSON.parse(this.parameters.tts || "false");
				if (this.parameters.option) {
					parameters.option = this.parameters.option;
				} else {
					parameters.option = "text";
				}
				const response = await functions.apiRequest(
					this,
					"POST",
					"http://" +
						process.env.LLM_HOST +
						":" +
						process.env.LLM_PORT,
					"/use-model",
					parameters,
					parseInt(process.env.LLM_TIMEOUT || "0"),
				);
				this.success = response?.status === "success" ? true : false;
				if (response?.message) {
					this.message.push(
						...(Array.isArray(response.message)
							? response.message
							: [response.message]),
					);
				}
				if (
					response?.response ||
					(response?.media?.mime_type && response?.media?.base64)
				) {
					this.success = true;
					this.results = [response];
					await this.insertPrompt(
						this.parameters.prompt,
						response?.response || "",
						response?.media?.mime_type || "",
						response?.media?.base64 || "",
					);
				}
				if (response?.parameters) {
					this.parameters = {
						...this.parameters,
						...response.parameters,
					};
				}
				if (response?.queries && Array.isArray(response.queries)) {
					this.queries.push(...response.queries);
				}
			} else {
				this.success = false;
				this.message.push(
					"Invalid parameters: user_id and prompt are required.",
				);
			}
		}
	};
	downloadModel = async () => {
		// const model = await snapshotDownload(
		// 	"meta-llama/Llama-3.1-8B-Instruct",
		// 	{ local_dir: "./models" },
		// );
		// this.success = true;
		// this.results = [model];
	};
	listModels = async () => {
		const models = await listModels();
		this.success = true;
		this.results = [models];
	};

	// Uses GenericAction CRUD so global-rule endpoints stay consistent with the existing API response shape.
	addGlobalRule = async () => {
		await this.add([models.GlobalRule]);
	};

	saveGlobalRule = async () => {
		this.parameters.id = this.parameters.global_rule_id;
		await this.save([models.GlobalRule]);
	};

	getGlobalRule = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
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
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (Object.hasOwn(models.GlobalRule.getAttributes(), "deleted")) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.GlobalRule.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(models.GlobalRule.getAttributes(), "created")
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.GlobalRule.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(models.GlobalRule.getAttributes(), "summary")
				) {
					keywordWhere.push({
						summary: {
							// iLike keeps keyword search case-insensitive on Postgres (MySQL LIKE used a case-insensitive collation).
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.GlobalRule.getAttributes(), "rule")) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.ModelType,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.GlobalRule.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.GlobalRule.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteGlobalRule = async () => {
		this.parameters.id = this.parameters.global_rule_id;
		await this.delete([models.GlobalRule]);
	};

	addModelType = async () => {
		await this.add([models.ModelType]);
	};

	saveModelType = async () => {
		await this.save([models.ModelType]);
	};

	getModelType = async () => {
		// await this.get([models.ModelType]);
		if (!this.parameters.order) {
			this.parameters.order = '[["model", "ASC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.ModelType.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			if (Object.hasOwn(models.ModelType.getAttributes(), "deleted")) {
				whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
			}
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.ModelType.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(models.ModelType.getAttributes(), "created")
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.ModelType.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (Object.hasOwn(models.ModelType.getAttributes(), "name")) {
					keywordWhere.push({
						name: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.ModelType.getAttributes(), "note")) {
					keywordWhere.push({
						note: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.ModelType,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.ModelType.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.ModelType.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};
	deleteModelType = async () => {
		this.parameters.id =
			this.parameters.model_type_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.ModelType]);
		}
	};

	// Persist user memory records using the existing GenericAction CRUD flow for consistent response formatting.
	addUserP2 = async () => {
		await this.add([models.UserP2]);
	};

	saveUserP2 = async () => {
		this.parameters.id = this.parameters.user_p2_id || this.parameters.id;
		if (this.parameters.id) {
			await this.save([models.UserP2]);
		}
	};

	getUserP2 = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserP2.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (Object.hasOwn(models.UserP2.getAttributes(), "deleted")) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.UserP2.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (Object.hasOwn(models.UserP2.getAttributes(), "created")) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserP2.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (Object.hasOwn(models.UserP2.getAttributes(), "summary")) {
					keywordWhere.push({
						summary: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.UserP2.getAttributes(), "rule")) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserP2,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserP2.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserP2.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteUserP2 = async () => {
		this.parameters.id = this.parameters.user_p2_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.UserP2]);
		}
	};

	addUserConversationSubject = async () => {
		await this.add([models.UserConversationSubject]);
	};

	saveUserConversationSubject = async () => {
		this.parameters.id =
			this.parameters.user_conversation_subject_id || this.parameters.id;
		if (this.parameters.id) {
			await this.save([models.UserConversationSubject]);
		}
	};

	getUserConversationSubject = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserConversationSubject.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (
			Object.hasOwn(
				models.UserConversationSubject.getAttributes(),
				"deleted",
			)
		) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"id",
					)
				) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"created",
					)
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserConversationSubject.name.trim() +
									".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"summary",
					)
				) {
					keywordWhere.push({
						summary: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"rule",
					)
				) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserConversationSubject,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserConversationSubject.findAll(
			this.sequelizeOptions,
		);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserConversationSubject.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteUserConversationSubject = async () => {
		this.parameters.id =
			this.parameters.user_conversation_subject_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.UserConversationSubject]);
		}
	};

	addUserConversationContent = async () => {
		await this.add([models.UserConversationContent]);
	};

	saveUserConversationContent = async () => {
		this.parameters.id =
			this.parameters.user_conversation_content_id || this.parameters.id;
		if (this.parameters.id) {
			await this.save([models.UserConversationContent]);
		}
	};

	getUserConversationContent = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserConversationContent.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (
			Object.hasOwn(
				models.UserConversationContent.getAttributes(),
				"deleted",
			)
		) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (
					Object.hasOwn(
						models.UserConversationContent.getAttributes(),
						"id",
					)
				) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(
						models.UserConversationContent.getAttributes(),
						"created",
					)
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserConversationContent.name.trim() +
									".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(
						models.UserConversationContent.getAttributes(),
						"summary",
					)
				) {
					keywordWhere.push({
						summary: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (
					Object.hasOwn(
						models.UserConversationContent.getAttributes(),
						"rule",
					)
				) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserConversationContent,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserConversationContent.findAll(
			this.sequelizeOptions,
		);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserConversationContent.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteUserConversationContent = async () => {
		this.parameters.id =
			this.parameters.user_conversation_content_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.UserConversationContent]);
		}
	};

	getUserConversation = async () => {
		// Normalize order input to prevent Sequelize query-generator errors from unsupported dotted-string paths.
		let normalizedOrder: any[] = [
			[
				Sequelize.col(
					models.UserConversationSubject.name.trim() + ".created",
				),
				"DESC",
			],
			[
				Sequelize.col(
					models.UserConversationContent.name.trim() + ".created",
				),
				"DESC",
			],
		];

		if (this.parameters.order) {
			let parsedOrder: any = this.parameters.order;
			if (
				typeof this.parameters.order === "string" &&
				validation.isJSON(this.parameters.order)
			) {
				parsedOrder = JSON.parse(this.parameters.order);
			}

			if (Array.isArray(parsedOrder)) {
				normalizedOrder = parsedOrder
					.map((entry: any) => {
						if (!Array.isArray(entry) || entry.length < 2) {
							return null;
						}

						const direction =
							typeof entry[entry.length - 1] === "string"
								? entry[entry.length - 1].toUpperCase()
								: "ASC";
						const safeDirection =
							direction === "DESC" ? "DESC" : "ASC";

						if (
							typeof entry[0] === "string" &&
							entry[0].includes(".")
						) {
							return [Sequelize.col(entry[0]), safeDirection];
						}

						if (
							typeof entry[0] === "string" &&
							typeof entry[1] === "string" &&
							(entry[1].toUpperCase() === "ASC" ||
								entry[1].toUpperCase() === "DESC")
						) {
							return [entry[0], entry[1].toUpperCase()];
						}

						return entry;
					})
					.filter((entry: any) => entry !== null);

				if (normalizedOrder.length === 0) {
					normalizedOrder = [
						[
							Sequelize.col(
								models.UserConversationSubject.name.trim() +
									".created",
							),
							"DESC",
						],
						[
							Sequelize.col(
								models.UserConversationContent.name.trim() +
									".created",
							),
							"DESC",
						],
					];
				}
			}
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserConversationSubject.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			include: [
				{
					model: models.UserConversationContent,
					attributes: {
						include: [
							[
								"id",
								(await functions.renameDialerObject(
									models.UserConversationContent.name.trim(),
									false,
								)) + "_id",
							],
						],
						exclude: ["id"],
					},
				},
			],
			order: normalizedOrder,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			if (
				Object.hasOwn(
					models.UserConversationSubject.getAttributes(),
					"deleted",
				)
			) {
				whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
			}
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"id",
					)
				) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"created",
					)
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserConversationSubject.name.trim() +
									".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(
						models.UserConversationSubject.getAttributes(),
						"subject",
					)
				) {
					keywordWhere.push({
						subject: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserConversationSubject,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserConversationSubject.findAll(
			this.sequelizeOptions,
		);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserConversationSubject.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	addUserGuideline = async () => {
		await this.add([models.UserGuideline]);
	};

	saveUserGuideline = async () => {
		this.parameters.id =
			this.parameters.user_guideline_id || this.parameters.id;
		if (this.parameters.id) {
			await this.save([models.UserGuideline]);
		}
	};

	getUserGuideline = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserGuideline.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (Object.hasOwn(models.UserGuideline.getAttributes(), "deleted")) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.UserGuideline.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(
						models.UserGuideline.getAttributes(),
						"created",
					)
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserGuideline.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(
						models.UserGuideline.getAttributes(),
						"summary",
					)
				) {
					keywordWhere.push({
						summary: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (
					Object.hasOwn(models.UserGuideline.getAttributes(), "rule")
				) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserGuideline,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserGuideline.findAll(
			this.sequelizeOptions,
		);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserGuideline.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteUserGuideline = async () => {
		this.parameters.id =
			this.parameters.user_guideline_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.UserGuideline]);
		}
	};

	addUserAvatar = async () => {
		await this.add([models.UserAvatar]);
	};

	saveUserAvatar = async () => {
		this.parameters.id =
			this.parameters.user_avatar_id || this.parameters.id;
		if (this.parameters.id) {
			await this.save([models.UserAvatar]);
		}
	};

	getUserAvatar = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.UserAvatar.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		whereTemp.push({ user_id: { [Op.eq]: this.parameters.user_id } });

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (Object.hasOwn(models.UserAvatar.getAttributes(), "deleted")) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.UserAvatar.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(models.UserAvatar.getAttributes(), "created")
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.UserAvatar.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(models.UserAvatar.getAttributes(), "summary")
				) {
					keywordWhere.push({
						summary: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.UserAvatar.getAttributes(), "rule")) {
					keywordWhere.push({
						rule: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.UserAvatar,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.UserAvatar.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.UserAvatar.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	deleteUserAvatar = async () => {
		this.parameters.id =
			this.parameters.user_avatar_id || this.parameters.id;
		if (this.parameters.id) {
			await this.delete([models.UserAvatar]);
		}
	};

	getAvatarVoice = async () => {
		try {
			const idField =
				(await functions.renameDialerObject(
					models.AvatarVoice.name.trim(),
					false,
				)) + "_id";

			let voices: types.KeyValue[] = await models.AvatarVoice.findAll({
				subQuery: false,
				attributes: {
					include: [["id", idField]],
					exclude: ["id"],
				},
				where: {
					deleted: { [Op.eq]: 0 },
				},
				order: [
					["gender", "ASC"],
					["label", "ASC"],
				],
				logging: (sql: string) => {
					this.queries.push(sql.toString());
				},
			});

			if (voices.length > 0) {
				voices = (await functions.formatResults(voices, [
					idField,
				])) as types.KeyValue[];
			}

			this.results = voices;
			this.success = true;
		} catch (error: any) {
			await functions.createError(this, error);
			this.success = false;
			this.message.push("Error loading avatar voice options.");
		}
	};

	getCustomModel = async () => {
		await this.get([models.CustomModel]);
	};
	insertPrompt = async (
		prompt: string,
		response: string = "",
		mime_type: string = "",
		base64: string = "",
	) => {
		let insertSQL: types.KeyValue = {};
		let promptID: number | boolean = false;
		this.sqlObject = {};
		this.sqlObject.prompt = prompt;
		this.sqlObject.response = response;
		this.sqlObject.mime_type = mime_type;
		this.sqlObject.base64 = base64;
		this.sqlObject.user_id = this.parameters.user_id;
		const masterValidation = await validation.validateAll(
			this,
			models.Prompt,
			this.sqlObject,
			this.parameters,
		);
		if (masterValidation) {
			insertSQL = await models.Prompt.create(this.sqlObject, {
				logging: (sql: string) => {
					this.queries.push(sql);
				},
			});

			if (insertSQL) {
				this.success = true;
				promptID = insertSQL.id;

				this.message.push(models.Prompt.name.trim() + " Created.");
			}
		}
		return promptID as number;
	};

	getUserChat = async () => {
		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							models.Prompt.name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			limit: this.parameters.limit,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		const whereTemp: types.KeyValue[] = [];
		if (Object.hasOwn(this.parameters, "user_id")) {
			if (this.parameters.user_id) {
				whereTemp.push({
					user_id: { [Op.eq]: this.parameters.user_id },
				});
			}
		}
		if (Object.hasOwn(this.parameters, "prompt_id")) {
			if (this.parameters.prompt_id) {
				whereTemp.push({
					id: { [Op.eq]: this.parameters.prompt_id },
				});
			}
		}

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
		}
		if (Object.hasOwn(models.Prompt.getAttributes(), "deleted")) {
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(models.Prompt.getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (Object.hasOwn(models.Prompt.getAttributes(), "created")) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								models.Prompt.name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (Object.hasOwn(models.Prompt.getAttributes(), "prompt")) {
					keywordWhere.push({
						prompt: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.Prompt.getAttributes(), "response")) {
					keywordWhere.push({
						response: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		let sqlWhere: types.KeyValue = {};
		if (whereTemp.length > 0) {
			sqlWhere = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				models.Prompt,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + models.ModelType.name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await models.Prompt.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					models.Prompt.name.trim(),
					false,
				)) + "_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
			this.results = this.results.reverse();

			const totalRows = await models.Prompt.count({
				where: sqlWhere,
			});
			this.totalRows = totalRows;
		}

		this.success = true;
	};
}
export { LLMAction };
