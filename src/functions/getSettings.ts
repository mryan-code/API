import * as types from "../types";
import * as models from "../models";
import * as functions from "../functions";
import { Op, Sequelize, QueryTypes } from "sequelize";
import * as data from "../data";
import { getChalk } from "./getChalk";
import moment from "moment";
import util from "util";
import * as validation from "../validation";
import { loadEnv } from "./loadEnv";

loadEnv();
const chalk = getChalk();

async function getSettings(
	context: types.HelperContext,
	user_id: number,
	log: boolean = true,
) {
	if (!user_id) {
		context.success = false;
		context.success_object[getSettings.name] = false;
		context.message.push("User ID is required.");
		return await functions.sendContext(context);
	}
	context = functions.initializeContext(context, { user_id });

	try {
		let settingsQuery: types.KeyValue[] = await models.User.findAll({
			subQuery: true,
			attributes: [
				["id", "user_id"],
				"first_name",
				"last_name",
				"avatar",
				"email",
				"timezone",
				"setup_complete",
			],
			include: [
				{
					model: models.Role,
					through: {
						attributes: [],
					},
					required: false,
					attributes: ["name", ["id", "role_id"], "auth_level"],
					where: {
						deleted: { [Op.eq]: 0 },
					},
				},
			],
			where: {
				id: { [Op.eq]: context.parameters.user_id },
			},
			limit: 1,
			logging: (sql: string) => {
				context.queries.push(sql.toString());
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(
						chalk.blue(
							"getSettings settings sql: " + sql.toString(),
						),
					);
				}
			},
		});

		if (settingsQuery.length > 0) {
			const formatFields = [
				"user_id",
				"status_id",
				"role_id",
				"hour_id",
				"company_id",
				"department_id",
			];
			context.results = (await functions.formatResults(
				settingsQuery as types.KeyValue[],
				formatFields,
			)) as types.KeyValue[];
			for await (const [key1, value1] of Object.entries(settingsQuery)) {
				if (key1 == "Hour") {
					for await (const [index, schedule] of Object.entries(
						value1 as types.KeyValue[],
					)) {
						for await (const [key2, value2] of Object.entries(
							schedule,
						)) {
							if (key2 == "day_label") {
								context.results[key1][index][key2] = moment()
									.day(value2?.toString())
									.format("dddd")
									.toLowerCase();
							}
							if (key2 == "start_label") {
								context.results[key1][index][key2] = moment(
									value2?.toString(),
									"hh:mm:ss",
								)
									.format("h:mm A")
									.toLowerCase();
							}
							if (key2 == "end_label") {
								context.results[key1][index][key2] = moment(
									value2?.toString(),
									"hh:mm:ss",
								)
									.format("h:mm A")
									.toLowerCase();
							}
						}
					}
				}
			}
			if (
				(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
					globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
				globalThis.globalVars.DEBUG_USER == "foobar"
			) {
				console.log(chalk.blue("AuthAction.get-settings"));
				console.log(
					chalk.blue(
						util.inspect(context.results, {
							depth: 1,
							colors: true,
						}),
					),
				);
			}
			context.success = true;
			context.success_object[getSettings.name] = true;
			return await functions.sendContext(context);
		}
		context.results = [];
		context.success = false;
		context.success_object[getSettings.name] = false;
		context.message.push("Settings not found.");
		return await functions.sendContext(context);
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("getSettings error: ", error);
		}
		await functions.createError(context, error);
		context.success = false;
		context.success_object[getSettings.name] = false;
		return await functions.sendContext(context);
	}
}

export { getSettings };
