import { Request, Response } from "express";
import * as types from "../types";
import moment from "moment";
import * as functions from "../functions";
import * as validation from "../validation";
import dotenv from "dotenv";
import { Op, Sequelize } from "sequelize";
import * as models from "../models";

// dayjs
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config({ quiet: true });

const testAuthorizationHeader = async (
	req: Request,
	res: Response,
): Promise<any> => {
	const returnValue: types.KeyValue = { value: false, message: "", code: 500 };
	const unauthorized = (): types.KeyValue => {
		if (!res.headersSent) {
			res.status(returnValue.code)
				.json({ message: returnValue.message })
				.end();
		}
		return returnValue;
	};
	try {
		let request_user: number | null = null;
		let user_jwt: string | null = null;
		let login_token: string | null = null;
		// Safely read auth token from body or headers to avoid crashes when req.body is undefined.
		const requestBody: types.KeyValue =
			req.body && typeof req.body === "object" ? req.body : {};
		if (
			requestBody.user_jwt &&
			typeof requestBody.user_jwt === "string"
		) {
			user_jwt = requestBody.user_jwt;
		}
		if (!user_jwt && req.headers) {
			const headerToken = req.headers["user_jwt"] || req.headers.authorization;
			if (headerToken && typeof headerToken === "string") {
				user_jwt = headerToken.startsWith("Bearer ")
					? headerToken.replace("Bearer ", "")
					: headerToken;
			}
		}

		if (user_jwt) {
			if (await functions.verifyJWT(user_jwt)) {
				const decodedToken: types.KeyValue | undefined =
					await functions.decodeJWT(user_jwt);
				if (decodedToken) {
					request_user = decodedToken.user_id;
					login_token = (await functions.decryptHash(decodedToken.login_token));
				}
			}
		}
		if (request_user == null || login_token == null) {
			returnValue.message = "Missing authorization credentials!";
			returnValue.code = 401;
			returnValue.value = false;
			return unauthorized();
		}
		const userQuery = await models.User.findOne({
			raw: true,
			where: {
				id: { [Op.eq]: request_user },
				login_token: { [Op.eq]: login_token },
			},
			limit: 1,
		});
		if (userQuery) {
			returnValue.value = true;
			returnValue.code = 200;
			returnValue.message = "Authorized";
		} else {
			returnValue.message = "Invalid credentials!";
			returnValue.code = 401;
			returnValue.value = false;
			return unauthorized();
		}
		return returnValue;
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "errors" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "warnings" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "info" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "debug"
		) {
			console.error("testAuthorizationHeader error: ", error);
		}
		returnValue.message =
			"An error occurred while testing authorization header.";
		returnValue.code = 500;
		returnValue.value = false;
		return unauthorized();
	}
};

export { testAuthorizationHeader };
