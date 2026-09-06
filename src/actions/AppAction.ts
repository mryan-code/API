import { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as functions from "../functions";
import * as models from "../models";
import { getChalk } from "../functions/getChalk";
import * as util from "util";
import * as types from "../types";
import moment from "moment";
const chalk = getChalk();
class AppAction extends GenericAction {
	task = async (): Promise<any> => {
		const pathTask: string = this.req.path.toString().replace("/", "");
		switch (pathTask) {
			case "start-app":
				await this.startApp();
				break;
			default:
				throw new Error("Invalid task: " + pathTask);
		}
	};

	startApp = async (): Promise<void> => {
		try {
			const returnValue: types.KeyValue = {};
			returnValue.env = {};
			returnValue.env.GLOBAL_DEBUG_LEVEL = process.env.GLOBAL_DEBUG_LEVEL;
			returnValue.env.DEBUG_USER = process.env.DEBUG_USER;
			returnValue.env.WSS_HOST = process.env.WSS_HOST;
			returnValue.env.WSS_PROTOCOL = process.env.WSS_PROTOCOL;
			returnValue.env.WSS_PORT = process.env.HTTP_PORT;

			if (this.parameters.user_id) {
				const settingsResults: types.HelperContext =
					await functions.getSettings(this, this.parameters.user_id);
				if (settingsResults.results.length > 0) {
					returnValue.settings = JSON.parse(
						JSON.stringify(settingsResults.results),
					)[0] as types.KeyValue;
				}
			}
			this.results = [returnValue];
			this.success = true;
		} catch (error: any) {
			console.log(chalk.red("startApp error: "), error);
			await functions.createError(this, error);
			this.success = false;
			this.message.push("Error starting app.");
		}
	};
}

export { AppAction };
