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
async function updateUser(context: types.HelperContext, user: types.KeyValue, log: boolean = true): Promise<types.HelperContext> {
	// Initialize context properties if they don't exist
	context = functions.initializeContext(context, user);
	try {
		delete user.login_token;
		const result = await models.User.update(user, {
				where: {
					id: { [Op.eq]: user.user_id },
				},
				logging: (sql: string) => {
					context.queries.push(sql.toString());
				},
			});
		if (result) {
			context.success = true;
			context.success_object[updateUser.name] = true;
			context.message.push("User updated.");
			context.results.user = user;
		} else {
			context.success = false;
			context.success_object[updateUser.name] = false;
			context.message.push("Unable to update user.");
		}
	} catch (error: any) {
		context.success = false;
		context.success_object[updateUser.name] = false;
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("updateUser error: ", error);
		}
		if (log === true) {
			await functions.createError(context, error);
		}
	} finally {
		return await functions.sendContext(context);
	}
}

export { updateUser };
