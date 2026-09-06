import * as types from "../types";
import * as functions from "./index";
import * as models from "../models";
import util from "util";
import { Op } from "sequelize";
import * as validation from "../validation";
import { getChalk } from "./getChalk";

// Use the CommonJS-safe chalk loader to prevent ERR_REQUIRE_ESM in ts-node runtime.
const chalk = getChalk();

const send = async function (
	message: types.KeyValue,
	user_id: number,
): Promise<boolean> {
	try {
		if ((global as any).wss_clients[user_id]) {
			if ((global as any).wss_clients[user_id].socket) {
				const user = await models.User.findByPk(user_id);

				if (user) {
					const jwtToken: string = await functions.generateJWT({
						user_id: user_id.toString(),
						login_token: user.login_token,
					});
					if (jwtToken) {
						message["auth"] = jwtToken;
						message["user_id"] = user_id.toString();
						(global as any).wss_clients[user_id].socket.send(
							JSON.stringify(message),
						);
						delete message["user_id"];
						return true;
					}
				} else {
					return false;
				}
			}
		}
		return false;
	} catch (error: any) {
		console.log(
			chalk.red("sendWebsocket error: " + (error as Error).message),
		);
		console.log(
			chalk.red(util.inspect(error, { depth: null, colors: true })),
		);
		await functions.createError(
			null as unknown as types.HelperContext,
			error as unknown as types.KeyValue,
		);
		return false;
	}
};

async function sendWebsocket(
	context: types.HelperContext,
	message: types.KeyValue,
	userArray: number[] = [],
	log: boolean = true,
) {
	// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
	// 	console.log(chalk.blue("sendWebsocket userArray: "), userArray);
	// }
	context = functions.initializeContext(context, message);
	try {
		if ((global as any).wss_clients) {
			if (userArray.length == 0) {
				//get all managers, supervisors, and admins from the database unfinished
				let dbUsers: types.KeyValue[] = await models.User.findAll({
					attributes: [["id", "user_id"]],
					include: [
						{
							model: models.Role,
							where: {
								auth_level: {
									[Op.in]: [1, 2, 3],
								},
							},
							required: true,
							through: {
								attributes: [],
							},
							attributes: [],
						},
					],
				});
				if (dbUsers.length > 0) {
					dbUsers = (await functions.formatResults(
						dbUsers,
					)) as types.KeyValue[];
					for await (const user of dbUsers) {
						userArray.push(user.user_id);
						//console.log(chalk.blue("user: "), user);
					}
				}
			}
			// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
			// 	console.log(chalk.blue("sendWebsocket userArray: "), userArray);
			// }

			userArray = userArray.map((id: number) => Number(id));

			if ((global as any).wss_clients) {
				for (const user_id in (global as any).wss_clients) {
					if (userArray.includes(Number(user_id))) {
						if ((global as any).wss_clients[user_id]) {
							if ((global as any).wss_clients[user_id].socket) {
								const sendResult: boolean = await send(
									message,
									Number(user_id),
								);
								if (sendResult === true) {
									context.success = true;
									context.success_object[sendWebsocket.name] =
										true;
									context.message.push(
										"Websocket sent successfully to " +
											user_id +
											".",
									);
								}
							}
						}
					}
				}
				if (context.success === false) {
					if (
						(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
								"info") ||
						globalThis.globalVars.DEBUG_USER == "foobar"
					) {
						console.log(chalk.red("sendWebsocket No users again."));
					}
					context.success = false;
					context.success_object[sendWebsocket.name] = false;
					context.message.push("No websocket clients found.");
				}

				return await functions.sendContext(context);
			}

			if (context.success === false) {
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(
						chalk.red("sendWebsocket No websocket clients found."),
					);
				}
			}
			context.success = false;
			context.success_object[sendWebsocket.name] = false;
			context.message.push("No websocket clients found.");
			return await functions.sendContext(context);
		}
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("sendWebsocket error:", error);
		}
		await functions.createError(
			context as unknown as types.HelperContext,
			error as unknown as types.KeyValue,
		);
		context.success = false;
		context.success_object[sendWebsocket.name] = false;
		context.message.push("Failed to send websocket.");
	}
	return await functions.sendContext(context);
}

export { sendWebsocket };
