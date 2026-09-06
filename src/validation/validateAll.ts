import * as types from "../types";
import * as functions from "../functions";
import * as validation from "./index";
import { Op } from "sequelize";
import util from "util";
import { getChalk } from "../functions/getChalk";

const chalk = getChalk();

async function validateAll(
	context: types.HelperContext,
	model: types.KeyValue,
	sqlObject: types.KeyValue,
	parameters: types.KeyValue
): Promise<boolean> {
	context = functions.initializeContext(context);
	let returnValue: boolean = true;

	try {
		const modelStructure: types.KeyValue = model.getAttributes();
		const modelName: string = model.name.trim();
		const idField: string =
			(await functions.renameDialerObject(modelName, false)) + "_id";
		const ignoreFields: string[] = ["created", "modified", "deleted", "id"];
		let original: types.KeyValue = {};

		if (sqlObject[idField] || sqlObject["id"]) {
			const fieldList: string[] = [];
			for await (const [key, value] of Object.entries(modelStructure)) {
				if (key != idField) {
					fieldList.push(key);
				}
			}

			const idValue = sqlObject[idField]
				? sqlObject[idField]
				: sqlObject["id"];

			original = await model.findOne({
				attributes: fieldList,
				where: {
					id: { [Op.eq]: idValue },
				},
				logging: async (sql: string) => {
					context.queries.push(sql.toString());
					if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
						console.log(chalk.green("validateAll original: " + sql));
					}
				},
			});
			// findOne returns null when no row is found; guard before Object.entries to avoid TypeError
			if (Object.entries(original).length > 0) {
				original = original.get({ plain: true });
			}
		}
		for await (const [key, value] of Object.entries(modelStructure)) {
			// console.log(chalk.yellow("validateAll key: " + key));
			// console.log(chalk.yellow("validateAll value: " + util.inspect(value, { depth: null, colors: true })));
			if (ignoreFields.includes(key)) {
				continue;
			}

			const errorTitle: string = await functions.titleify(key);
			if (value.allowNull === false) {
				// Prefer an already-populated sqlObject value (often pre-processed/normalized upstream),
				// then fall back to parameters, then finally original/defaults. This prevents validateAll
				// from overwriting transformed values with raw request parameters.
				const sqlObjectHasKey: boolean =
					Object.hasOwn(sqlObject, key) &&
					sqlObject[key] !== null &&
					sqlObject[key] !== undefined;
				if (sqlObjectHasKey) {
					switch (key) {
						case "email":
							if (!validation.isEmail(sqlObject[key])) {
								context.message.push(
									modelName +
										": " +
										errorTitle +
										" is an invalid email.",
								);
							}
							break;
						default:
							break;
					}
				} else if (Object.hasOwn(parameters, key)) {
					switch (key) {
						case "email":
							if (validation.isEmail(parameters[key])) {
								sqlObject[key] = parameters[key];
							} else {
								context.message.push(
									modelName +
										": " +
										errorTitle +
										" is an invalid email.",
								);
							}
							break;
						default:
							sqlObject[key] = parameters[key];
							break;
					}
				} else {
					if (Object.hasOwn(original, key)) {
						sqlObject[key] = original[key];
					} else if (
						value.defaultValue !== undefined &&
						value.defaultValue !== null
					) {
						sqlObject[key] = value.defaultValue;
					} else {
						sqlObject[key] = null;
					}
				}
				if (sqlObject[key] === null || sqlObject[key] === undefined) {
					returnValue = false;
					if (
						(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
								"info") ||
						globalThis.globalVars.DEBUG_USER == "foobar"
					) {
						console.log(
							chalk.red(
								"error: validateAll model.name " + model.name,
							),
						);
						console.log(chalk.red("error: validateAll key " + key));
						console.log(
							chalk.red(
								"error: validateAll parameters " +
									parameters[key],
							),
							parameters,
						);
						console.log(chalk.red("error: validateAll original "));
						console.log(
							chalk.red(
								util.inspect(original, {
									depth: null,
									colors: true,
								}),
							),
						);
						console.log(
							chalk.red(
								"error: validateAll value.defaultValue " +
									value.defaultValue,
							),
						);
						console.log(
							chalk.red(
								"error: validateAll value is null or undefined " +
									sqlObject[key],
							),
						);
					}
					context.message.push(
						modelName + ": " + errorTitle + " is required.",
					);
				}
			} else {
				sqlObject[key] = null;
				if (parameters[key]) {
					switch (key) {
						case "email":
							if (validation.isEmail(parameters[key])) {
								sqlObject[key] = parameters[key];
							} else {
								context.message.push(
									modelName +
										": " +
										errorTitle +
										" is an invalid email.",
								);
							}
							break;
						default:
							sqlObject[key] = parameters[key];
							break;
					}
				} else {
					// if (value.defaultValue != null) {
					// 	sqlObject[key] = value.defaultValue;
					// } else {
					// 	sqlObject[key] = original[key];
					// }
					sqlObject[key] = original[key];
				}
				// if (!sqlObject.hasOwnProperty(key)) {
				// 	returnValue = false;
				// }
			}
			if (
				(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
					globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
				globalThis.globalVars.DEBUG_USER == "foobar"
			) {
				if (returnValue == false) {
					console.log("validateAll message:");
					console.dir(context.message, { colors: true, depth: null });
				}
			}
		}
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("validateAll error:", error);
		}
		returnValue = false;
	} finally {
		return returnValue;
	}
}

export { validateAll };
