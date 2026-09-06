import * as functions from "./functions";
import * as data from "./data";
import * as types from "./types";
import * as validation from "./validation";
import path from "path";
import WebSocket, { WebSocketServer } from "ws";
import http, { createServer, Server } from "http";
import https from "https";
import net, { Socket } from "net";
import { glob, readFileSync } from "node:fs";
import express, { Request, Response, NextFunction } from "express";
import { Json } from "sequelize/types/utils";
import * as models from "./models";
import { Op } from "sequelize";
import moment from "moment-timezone";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

//debug
import { getChalk } from "./functions/getChalk";
import util from "util";
import { loadEnv } from "./functions/loadEnv";
const chalk = getChalk();

loadEnv();
const server: types.KeyValue = { value: null };
const serverOptions: types.KeyValue = { value: null };
const moduleTitle: string = "Websockets";

const setup = async function (server: Server): Promise<types.KeyValue> {
	const returnValue: types.KeyValue = { value: {} };
	try {
		const wss = new WebSocketServer({ server });
		const wss_clients: types.KeyValue = {};

		const clearTimeouts = async function (user_id: string): Promise<void> {
			if (wss_clients[user_id]) {
				if (wss_clients[user_id].ping_timeout) {
					for (let ping of wss_clients[user_id].ping_timeout) {
						clearTimeout(ping);
					}
				}
				if (wss_clients[user_id].pong_timeout) {
					for (let pong of wss_clients[user_id].pong_timeout) {
						clearTimeout(pong);
					}
				}
			}
		};

		const sendPing = async function (
			user_id: string,
			user_timezone: string,
			pingTimeoutMS: number = 10000,
		): Promise<void> {
			await clearTimeouts(user_id);
			const ping_timeout: any = setTimeout(async () => {
				if (wss_clients[user_id]) {
					wss_clients[user_id].socket.send(
						JSON.stringify({ type: "ping", user_id: user_id }),
					);
					await pongTimeout(user_id, user_timezone);
					if (
						(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
								"info") ||
						globalThis.globalVars.DEBUG_USER == "foobar"
					) {
						console.log(
							chalk.blue(
								"wss ping sent to user_id:" +
									user_id +
									" " +
									moment().format("ss"),
							),
						);
						console.log(
							chalk.blue("user_timezone: " + user_timezone),
						);
					}
				}
			}, pingTimeoutMS);

			if (wss_clients[user_id]) {
				wss_clients[user_id].ping_timeout.push(ping_timeout);
			}
		};

		const pongTimeout = async function (
			user_id: string,
			user_timezone: string,
			pongTimeoutMS: number = 30000,
		): Promise<any> {
			const pong_timeout: any = setTimeout(async () => {
				if (wss_clients[user_id]) {
					if (
						(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
								"info") ||
						globalThis.globalVars.DEBUG_USER == "foobar"
					) {
						console.log(chalk.blue("wss pong timeout"));
					}
					await sendPing(user_id as unknown as string, user_timezone);
				}
			}, pongTimeoutMS);

			if (wss_clients[user_id]) {
				wss_clients[user_id].pong_timeout.push(pong_timeout);
			}
		};

		wss.on("connection", async function (socket: WebSocket, req: Request) {
			let user_id: string = "";
			let user_timezone: string | null = null;
			if (req) {
				if (req.url) {
					// Use WHATWG URL parsing to avoid the deprecated url.parse API warning.
					const parsedUrl = new URL(req.url, "ws://localhost");
					const queryParams = parsedUrl.searchParams;
					// Deprecated code:
					// const parsedUrl = parse(req.url, true);
					// const queryParams = parsedUrl.query;
					const queryUserId = queryParams.get("user_id");
					const queryUserTimezone =
						queryParams.get("user_timezone");
					if (queryUserId) {
						user_id = queryUserId;
					}

					if (queryUserTimezone) {
						user_timezone = queryUserTimezone;
					}
				}
			}
			socket.on("open", async function open() {
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(chalk.blue("wss open"));
				}
			});

			socket.on("error", async function (error: types.KeyValue) {
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(
						chalk.red(
							"wss error: " + (error?.message || "wss error"),
						),
					);
				}
			});

			socket.on("close", async function () {
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(chalk.blue("wss close"));
				}
				await clearTimeouts(user_id as unknown as string);
				delete (globalThis as unknown as types.KeyValue).wss_clients[
					user_id
				];
			});

			socket.on(
				"message",
				async function (data: string, isBinary: boolean) {
					const websocketMessage: types.KeyValue = {};

					let wssMessage: any = false;
					if (validation.isJSON(data)) {
						wssMessage = JSON.parse(data);

						switch (wssMessage.type) {
							case "init":
								if (
									(globalThis.globalVars.GLOBAL_DEBUG ==
										"true" &&
										globalThis.globalVars
											.GLOBAL_DEBUG_LEVEL == "info") ||
									globalThis.globalVars.DEBUG_USER == "foobar"
								) {
									console.log(
										chalk.blue(
											"wss init received from user_id:" +
												user_id,
										),
									);
									console.log(
										chalk.blue(
											"user_timezone: " + user_timezone,
										),
									);
								}

								// Guard invalid user IDs to prevent registering bad websocket sessions.
								if (validation.isNumeric(user_id) == false) {
									break;
								}

								if (wss_clients[user_id]) {
									if (wss_clients[user_id].ping_timeout) {
										for (let ping of wss_clients[user_id]
											.ping_timeout) {
											clearTimeout(ping);
										}
									}
									if (wss_clients[user_id].pong_timeout) {
										for (let pong of wss_clients[user_id]
											.pong_timeout) {
											clearTimeout(pong);
										}
									}
								}

								wss_clients[user_id] = {};
								wss_clients[user_id].user_id = user_id;
								wss_clients[user_id].ping_timeout = [];
								wss_clients[user_id].pong_timeout = [];
								wss_clients[user_id].socket = socket;

								await sendPing(
									user_id as unknown as string,
									user_timezone as string,
								);

								break;
							case "pong":
								if (
									(globalThis.globalVars.GLOBAL_DEBUG ==
										"true" &&
										globalThis.globalVars
											.GLOBAL_DEBUG_LEVEL == "info") ||
									globalThis.globalVars.DEBUG_USER == "foobar"
								) {
									console.log(
										chalk.blue(
											"wss pong received from user_id:" +
												user_id,
										),
									);
									console.log(
										chalk.blue(
											"user_timezone: " + user_timezone,
										),
									);
								}
								await sendPing(
									user_id,
									user_timezone as string,
								);

								break;
							default:
								if (
									(globalThis.globalVars.GLOBAL_DEBUG ==
										"true" &&
										globalThis.globalVars
											.GLOBAL_DEBUG_LEVEL == "info") ||
									globalThis.globalVars.DEBUG_USER == "foobar"
								) {
									console.log(
										chalk.blue(
											"wss message received from user_id:" +
												user_id,
										),
									);
									console.log(
										chalk.blue(
											util.inspect(data, {
												colors: true,
												depth: null,
											}),
										),
									);
								}

								// if (wss_clients[user_id]) {
								// 	if (wss_clients[user_id].socket) {
								// 		wss_clients[user_id].socket.send(data);
								// 	}
								// }
								break;
						}
					}
				},
			);
		});

		(globalThis as unknown as types.KeyValue).wss = wss;
		(globalThis as unknown as types.KeyValue).wss_clients = wss_clients;

		returnValue.value = { colour: data.successColour, status: true };
	} catch (error: any) {
		returnValue.value = {
			colour: data.errorColour,
			status: false,
			error: error as types.KeyValue,
		};
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.log(chalk.red("websockets.setup error: " + error.message));
			console.log(
				chalk.red(util.inspect(error, { depth: null, colors: true })),
			);
		}
		await functions.createError(
			null as unknown as types.HelperContext,
			error as any,
		);
	} finally {
		return returnValue.value;
	}
};

const websockets = async function (server: Server): Promise<types.KeyValue> {
	const returnValue: types.KeyValue = { value: {} };
	returnValue.value = await setup(server);
	return { [moduleTitle]: returnValue.value };
};

export default websockets;
