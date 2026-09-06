import * as types from "../types";
import * as models from "../models";
import * as functions from "./index";
import { getChalk } from "./getChalk";
import * as validation from "../validation";
import util from "util";
import Sequelize, { Model, Op } from "sequelize";
import moment from "moment-timezone";
const chalk = getChalk();

async function sendContext(context: types.HelperContext): Promise<types.HelperContext> {
	try {
		context.request = {
			start_time: context.startTimer?.format(),
			end_time: moment.utc().format(),
			duration: moment.utc().diff(context.startTimer, "milliseconds").toString() + " ms",
		};
		return context as types.HelperContext;
	} catch (error: any) {
		context.success = false;
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("sendContext error: ", error);
		}
		return context as types.HelperContext;
	}
}

export { sendContext };
