import { Request, Response, NextFunction } from "express";
import * as models from "../models";
import * as types from "../types";
import * as functions from "../functions";
import * as validation from "../validation";
import { loadEnv } from "../functions/loadEnv";

loadEnv();

const errorRequest = async (
	error: any,
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<any> => {
	// const errorObject: types.KeyValue = {
	// 	message: err.message,
	// 	stack: err.stack,
	// 	file: err.file,
	// 	line: err.line,
	// };
	// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
	// 	console.log("errorRequest errorObject:");
	// 	console.dir(errorObject, { colors: true, depth: null });
	// 	console.log("\n\n");
	// }
	const errorContext: types.HelperContext = {
		parameters: {},
		message: [],
		results: {},
		sqlObject: {},
		queries: [],
		success: false,
		// Error middleware builds a helper context directly, so include required per-helper success flags.
		success_object: {},
	};
	const errorResult = await functions.createError(errorContext, error);
	// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
	// 	console.log("errorRequest errorResult: ", errorResult);
	// }
};

export { errorRequest };
