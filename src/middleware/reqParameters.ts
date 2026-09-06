import { Request, Response, NextFunction } from "express";
import * as types from "../types";
import * as validation from "../validation";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

function reqParameters(req: Request, res: Response, next: NextFunction): any {
	try {
		let postParameters: types.KeyValue = {};
		if ("query" in req) {
			if (typeof req.query === "object") {
				postParameters = { ...postParameters, ...req.query };
			}
		}

		if ("headers" in req) {
			if (typeof req.headers === "object") {
				if (Object.entries(req.headers).length > 0) {
					for (let [key, value] of Object.entries(req.headers)) {
						if (
							(key == "user_jwt" || key == "authorization") &&
							value
						) {
							if ((value as string).startsWith("Bearer ")) {
								value = (value as string).replace(
									"Bearer ",
									"",
								);
							}
							postParameters["user_jwt"] = value;
						}
					}
				}
			}
		}

		if ("body" in req) {
			if (typeof req.body === "object") {
				postParameters = { ...postParameters, ...req.body };
			}
		}

		const parametersTemp: types.KeyValue = { ...postParameters };
		if (Object.entries(parametersTemp).length > 0) {
			for (let [key, value] of Object.entries(parametersTemp)) {
				if (value !== null && value !== undefined) {
					// if (key === "start_date" || key === "end_date") {
					// 	parametersTemp.value[key] = moment(parametersTemp.value[key], dateTimeFormat, true).utc();
					// 	if (!parametersTemp.value[key].isValid()) {
					// 		parametersTemp.value[key] = moment.utc();
					// 	}
					// 	parametersTemp.value[key] = parametersTemp.value[key].format(dateTimeFormat);
					// }

					// if (key === "date") {
					// 	parametersTemp.value[key] = moment(parametersTemp.value[key], dateFormat);
					// 	if (!parametersTemp.value[key].isValid()) {
					// 		parametersTemp.value[key] = moment.utc().startOf("day");
					// 	}
					// 	parametersTemp.value[key] = parametersTemp.value[key].format(dateFormat);
					// }
					//

					if (
						key === "show_deleted" &&
						(value === "1" ||
							value === "0" ||
							value === 1 ||
							value === 0)
					) {
						const parsedValue = parseInt(value as string, 10);
						parametersTemp[key] = parsedValue === 1 ? true : false;
						continue;
					}

					if (value === "true" || value === "false") {
						parametersTemp[key] = value === "true" ? true : false;
						continue;
					}

					if (typeof value === "boolean") {
						parametersTemp[key] = value;
						continue;
					}

					if (Array.isArray(value)) {
						parametersTemp[key] = value;
						continue;
					}

					if (validation.isJSON(value)) {
						parametersTemp[key] = JSON.parse(value as string);
						continue;
					}

					// if (!Number.isNaN(value)) {
					// 	parametersTemp[key] = Number(value);
					// 	continue;
					// }

					if (typeof value === "string") {
						parametersTemp[key] = value.trim();
						continue;
					}
				}
			}

			req.body = parametersTemp;
		}
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "errors" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "warnings" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "info" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "debug"
		) {
			console.error("reqParameters error: ", error);
		}
		return next(error);
	} finally {
		return next();
	}
}

export { reqParameters };
