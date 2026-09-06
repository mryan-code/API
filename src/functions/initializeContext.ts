import * as types from "../types";
import { Request, Response } from "express";
import moment from "moment-timezone";

// Initialize context properties if they don't exist
// This ensures all required context properties are available for helper functions
function initializeContext(
	context: types.HelperContext | null,
	parameters?: types.KeyValue,
	req?: Request,
	res?: Response,
): types.HelperContext {
	var fakeError = new Error();
	var stack = fakeError.stack.split("\n");
	var caller = stack[2]
		.toString()
		.split(":")[0]
		.split("/")
		.pop()
		.split(".")[0];
	if (
		(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
		globalThis.globalVars.DEBUG_USER == "foobar"
	) {
		console.log("initializeContext caller: ");
		console.dir(caller, { colors: true, depth: null });
	}
	if (!context) {
		context = {
			results: {},
			message: [],
			queries: [],
			success: false,
			sqlObject: {},
			parameters: {},
			res: res,
			req: req,
			startTimer: moment.utc(),
			success_object: {},
			settings: {},
		};
	}
	if (!context.results) {
		context.results = {};
	}
	if (!context.message) {
		context.message = [];
	}
	if (!context.queries) {
		context.queries = [];
	}
	if (!context.success) {
		context.success = false;
	}
	if (!context.success_object) {
		context.success_object = {};
	}
	if (!context.settings) {
		context.settings = {};
	}
	if (!context.sqlObject) {
		context.sqlObject = {};
	}
	if (!context.parameters) {
		context.parameters = {};
	}
	// Store the parameters passed to the function in context.parameters if provided
	if (parameters) {
		context.parameters = { ...context.parameters, ...parameters };
	}
	context.success_object[caller] = false;
	return context;
}

export { initializeContext };
