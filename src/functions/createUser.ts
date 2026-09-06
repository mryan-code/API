import * as types from "../types";
import * as models from "../models";
import * as functions from "./index";
import * as validation from "../validation";
import { Op } from "sequelize";
import { getChalk } from "./getChalk";

// Use the CommonJS-safe chalk loader to prevent ERR_REQUIRE_ESM in ts-node runtime.
const chalk = getChalk();

// Refactored to use context as the first parameter
// This function updates a user and stores results in the context object
async function createUser(
	context: types.HelperContext,
	log: boolean = true,
): Promise<types.HelperContext> {
	// Initialize context properties if they don't exist
	context = functions.initializeContext(context);
	try {
		const masterValidation = await validation.validateAll(
			context,
			models.User,
			context.sqlObject,
			context.parameters,
		);
		if (masterValidation) {
			const insertSQL: any = await models.User.create(context.sqlObject, {
				logging: (sql: string) => {
					context.queries.push(sql.toString());
				},
			});

			if (insertSQL) {
				// Insert the new role
				context.sqlObject = {};
				context.sqlObject.role_id = 4;
				context.sqlObject.user_id = insertSQL.id;
				await models.UserRole.create(context.sqlObject, {
					logging: (sql: string) => {
						context.queries.push(sql.toString());
					},
				});

				// Insert the new avatar
				context.sqlObject = {};
				context.sqlObject.user_id = insertSQL.id;
				await models.UserAvatar.create(context.sqlObject, {
					logging: (sql: string) => {
						context.queries.push(sql.toString());
					},
				});

				context.success = true;
				context.results.user = insertSQL;
				context.success_object[createUser.name] = true;
				context.message.push(models.User.name.trim() + " Created.");
			}
		}
	} catch (error: any) {
		context.success = false;
		context.success_object[createUser.name] = false;
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("createUser error: ", error);
		}
		if (log === true) {
			await functions.createError(context, error);
		}
	} finally {
		return await functions.sendContext(context);
	}
}

export { createUser };
