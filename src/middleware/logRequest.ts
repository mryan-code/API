import { Request, Response, NextFunction } from "express";
import * as models from "../models";
import * as types from "../types";
import * as validation from "../validation";
import * as functions from "../functions";
import { getChalk } from "../functions/getChalk";
import { loadEnv } from "../functions/loadEnv";
const chalk = getChalk();
loadEnv();

const logRequest = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<any> => {
	const returnValue: types.KeyValue = {
		status: false,
		message: "Failed to log request",
	};
	try {
		const insert = {} as types.KeyValue;
		let parameters: types.KeyValue = {};
		insert.origin = req.headers.origin ?? null;
		insert.user_agent = req.headers["user-agent"] ?? null;
		insert.method = req.method;
		insert.path =
			req.protocol + "://" + req.headers.host + req.baseUrl + req.path;
		parameters = {
			...parameters,
			...req.body,
			...req.query,
			...req.params,
		};
		if (parameters.request_token) {
			delete parameters.request_token;
		}
		if (parameters.request_user) {
			delete parameters.request_user;
		}
		if (parameters.body) {
			parameters.body = "REDACTED";
		}
		insert.parameters = JSON.stringify(parameters);
		insert.ip_address = (await functions.getIP()) || null;
		if (insert.ip_address) {
			insert.geo_location = await functions.getGeoLocation(
				insert.ip_address,
			);
		}
		// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || (globalThis.globalVars.DEBUG_USER == "foobar" && req.path.includes("sms-create"))) {
		// 	console.log(chalk.yellow("logRequest path: "), req);
		// 	console.log(chalk.yellow("logRequest: "), insert);
		// }
		models.RequestLog.create(insert, { logging: false });
		returnValue.value = { status: true, message: "Request logged" };
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("logRequest error: ", error);
		}
		returnValue.value = { status: false, message: "Failed to log request" };
	} finally {
		next();
	}
};

export { logRequest };
