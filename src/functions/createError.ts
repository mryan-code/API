import * as types from "../types";
import * as models from "../models";
import * as functions from "./index";
import * as validation from "../validation";
import { getChalk } from "./getChalk";

const chalk = getChalk();
async function parseError(error: any) {
	if (error.message.length > 255) {
		error.message = error.message.substring(0, 255);
	}
	let stack: string | null = null;
	let lineNumber: number | null = null;
	let fileName: string | null = null;
	if (error.lineNumber) {
		lineNumber = error.lineNumber;
		fileName = error.fileName;
	} else {
		// Deprecated code (kept for reference): splitting without guarding throws when stack is missing.
		// const stackLines = error.stack.split("\n");
		// Guard missing stack so createError never throws while parsing non-Error objects.
		const stackLines =
			typeof error.stack === "string" ? error.stack.split("\n") : [];
		if (stackLines.length > 1) {
			const firstStackLine = stackLines[1];
			const match = firstStackLine.match(
				/([a-zA-Z0-9\.\_]+):(\d+):(\d+)/,
			);
			if (match) {
				lineNumber = match[2];
				fileName = match[1];
			}
		}
	}
	if (error.stack) {
		stack = error.stack;
		if (stack !== null) {
			stack = stack.replace(/\n/g, "</li><li>");
			stack = "<ul><li>" + stack + "</li></ul>";
		}
	}
	const errorTemp: types.KeyValue = {};
	if (error.message) {
		errorTemp.message = error.message.toString();
	}
	if (lineNumber) {
		errorTemp.line = lineNumber;
	}
	if (fileName) {
		errorTemp.file = fileName;
	}
	if (stack && stack !== null) {
		errorTemp.stack = stack;
	}
	return errorTemp;
}

// Refactored to use context as the first parameter
// This function creates an error log and stores results in the context object
async function createError(
	context: types.HelperContext,
	error: types.KeyValue,
	type: string = "backend",
): Promise<types.HelperContext> {
	// Initialize context properties if they don't exist
	context = functions.initializeContext(context, error);
	// if (globalThis.globalVars.NODE_ENV == "local" && globalThis.globalVars.DEBUG_USER == "foobar") {
	// 	return await functions.sendContext(context);
	// }
	try {
		context.sqlObject = {};
		context.sqlObject.resolved = "0";
		context.sqlObject.environment = globalThis.globalVars.NODE_ENV;
		context.sqlObject.type = type;
		const parsedError = await parseError(error);
		// Merge parsed error fields into sqlObject
		context.sqlObject = { ...context.sqlObject, ...parsedError };
		const masterValidation = await validation.validateAll(
			context,
			models.ErrorLog,
			context.sqlObject,
			error,
		);
		if (masterValidation) {
			const insertSQL: any = await models.ErrorLog.create(
				context.sqlObject,
				{
					logging: (sql: string) => {
						context.queries.push(sql.toString());
						if (
							(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
								globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
									"info") ||
							globalThis.globalVars.DEBUG_USER == "foobar"
						) {
							console.log(
								chalk.blue(
									"createError insertSQL sql: " +
										sql.toString(),
								),
							);
						}
					},
				},
			);

			if (insertSQL) {
				context.message.push("Error log created.");
				const errorLogPlain: types.KeyValue =
					await functions.formatResults(insertSQL, []);
				const encryptedErrorLogId = errorLogPlain.id.toString();
				delete errorLogPlain.id;
				const formattedErrorLog: types.KeyValue = { ...errorLogPlain };
				formattedErrorLog.error_log_id = encryptedErrorLogId;
				context.results.error_log = formattedErrorLog;
				context.results.error_log_id = encryptedErrorLogId;
				context.parameters.error_log_id = insertSQL.id;

				const websocketMessage: types.KeyValue = {};
				websocketMessage["type"] = "received_error";
				insertSQL.error_log_id = encryptedErrorLogId;
				websocketMessage["error"] = insertSQL;
				const sendWebsocketReturn: types.HelperContext =
					await functions.sendWebsocket(context, websocketMessage);
			} else {
				// If insertSQL is null, set results to null
				context.success = false;
				context.message.push("Unable to create error log.");
			}
		} else {
			context.success = false;
			context.message.push("Unable to create error log.");
		}
	} catch (error) {
		context.success = false;
		context.message.push("Unable to create error log.");
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("createError error: ", error);
		}
	}
	return await functions.sendContext(context);
}

export { createError };
