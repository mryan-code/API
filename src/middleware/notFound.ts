import { Request, Response, NextFunction } from "express";
import * as models from "../models";
import * as types from "../types";
import * as validation from "../validation";
import { loadEnv } from "../functions/loadEnv";

loadEnv();

const notFound = (req: Request, res: Response, next: NextFunction): any => {
	const returnValue: types.KeyValue = {
		status: false,
		message: "Failed to log request",
	};
	try {
		res.status(404).send(
			"Sorry, the page you're looking for cannot be found.",
		);
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("notFound error: ", error);
		}
		returnValue.value = { status: false, message: "Failed to log request" };
	} finally {
		next();
	}
};

export { notFound };
