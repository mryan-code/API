import * as types from "./types";
import * as functions from "./functions";
import https from "https";
import http, { Server } from "http";
import { loadEnv } from "./functions/loadEnv";
import websockets from "./websockets";
import { Op } from "sequelize";
import * as models from "./models";
import util from "util";
import { readFileSync, existsSync } from "fs";
import path from "path";
import database from "./database";
import app from "./app";

loadEnv();

const globalVars: types.KeyValue = process.env;
if (!globalThis.globalVars) {
	(globalThis as unknown as types.KeyValue).globalVars = globalVars;
} else {
	Object.assign(globalThis.globalVars, globalVars);
}
let server: Server | null = null;
let serverOptions: types.KeyValue = {};
const serverKeepAliveTimeoutMS = 65000;
const serverHeadersTimeoutMS = 66000;

const startServer = async () => {
	let dbLoaded: boolean = false;
	await database().then(async (returnValue: types.KeyValue) => {
		console.log(returnValue);
		if (Object.keys(returnValue).length > 0) {
			for await (const module of Object.keys(returnValue)) {
				if (
					globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "info" ||
					globalThis.globalVars.DEBUG_USER === "mryan"
				) {
					console.log(
						module +
							": " +
							util.inspect(
								JSON.parse(returnValue[module].status),
								false,
								null,
								true /* enable colors */,
							),
					);
				}
				dbLoaded = returnValue[module].status;
			}
		}
	});

	if (dbLoaded) {
		let userQuery: types.KeyValue | null = await models.User.findOne({
			attributes: [["id", "user_id"], "login_token"],
			raw: true,
			where: {
				id: { [Op.eq]: globalThis.globalVars.USER_ID },
			},
			logging: (sql: string) => {
				// if (globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "info") {
				// 	console.log(sql.toString());
				// }
			},
			limit: 1,
		});
		if (userQuery) {
			userQuery = (await functions.formatResults(userQuery, [
				"user_id",
			])) as types.KeyValue;
			console.log(
				util.inspect(
					("login_token: Bearer " +
						(await functions.generateJWT({
							user_id: userQuery.user_id,
							login_token: userQuery.login_token,
						}))) as string,
					false,
					null,
					true /* enable colors */,
				),
			);
		}

		if (globalThis.globalVars.HTTP_PROTOCOL === "https") {
			const keyPath = readFileSync(
				path.resolve(
					"certificates/" + process.env.NODE_ENV + "-key.pem",
				),
			);
			const certPath = readFileSync(
				path.resolve(
					"certificates/" + process.env.NODE_ENV + "-cert.pem",
				),
			);
			if (existsSync(keyPath) && existsSync(certPath)) {
				serverOptions = {
					key: keyPath,
					cert: certPath,
				};
				server = https.createServer(serverOptions, app);
			} else {
				server = http.createServer(app);
			}
		} else {
			server = http.createServer(app);
		}

		if (server) {
			server.keepAliveTimeout = serverKeepAliveTimeoutMS;
			server.headersTimeout = serverHeadersTimeoutMS;

			await websockets(server as Server).then(
				async (returnValue: types.KeyValue) => {
					if (Object.keys(returnValue).length > 0) {
						for await (const module of Object.keys(returnValue)) {
							if (
								globalThis.globalVars.GLOBAL_DEBUG_LEVEL ===
									"info" ||
								globalThis.globalVars.DEBUG_USER === "mryan"
							) {
								console.log(
									module +
										": " +
										util.inspect(
											JSON.parse(
												returnValue[module].status,
											),
											false,
											null,
											true /* enable colors */,
										),
								);
							}
						}
					}
				},
			);

			server.listen(globalThis.globalVars.HTTP_PORT, async () => {
				console.log(
					util.inspect(
						`Web server running. ${globalThis.globalVars.HTTP_PROTOCOL}://${globalThis.globalVars.HTTP_HOST}:${globalThis.globalVars.HTTP_PORT}`,
						false,
						null,
						true /* enable colors */,
					),
				);
			});
		}
	}
};

startServer();
