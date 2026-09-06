import e, { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import { randomInt } from "crypto";
import * as models from "../models";
import moment from "moment";
import { Op, Sequelize, DataTypes } from "sequelize";
import { v6 as uuidv6 } from "uuid";
import { getChalk } from "../functions/getChalk";
import jwt from "jsonwebtoken";
import { loadEnv } from "../functions/loadEnv";

const chalk = getChalk();
import util from "util";

loadEnv();
class AuthAction extends GenericAction {
	loginAuth = async () => {
		if (Object.hasOwn(this.parameters, "email")) {
			if (validation.isEmail(this.parameters.email)) {
				const emailQuery: types.KeyValue | null =
					await models.User.findOne({
						subQuery: false,
						raw: true,
						where: {
							email: { [Op.eq]: this.parameters.email },
							deleted: { [Op.eq]: 0 },
						},
						limit: 1,
						logging: (sql: string) => {
							this.queries.push(sql.toString());
						},
					});

				if (emailQuery) {
					const authCode = this.generateAuthCode();
					const auth_code_expiry: number = parseInt(
						process.env.AUTH_CODE_EXPIRY_MINUTES || "15",
					);
					const updateObject = {} as types.KeyValue;
					updateObject.auth_code = authCode;
					updateObject.auth_code_expires = moment
						.utc()
						.add(auth_code_expiry, "minutes")
						.format();
					updateObject.login_token = null;
					const upDate = await models.User.update(updateObject, {
						where: {
							id: { [Op.eq]: emailQuery.id },
						},
						logging: (sql: string) => {
							this.queries.push(sql.toString());
						},
					});
					const approvedUsers = ["2"]; // Replace with actual approved user IDs
					if (approvedUsers.includes(emailQuery.id.toString())) {
						this.output.auth_code = authCode;
						this.message.push("Email sent.");
					} else {
						this.message.push(
							"Email not sent. User is not approved.",
						);
						console.log("AuthAction.AuthCode: ", authCode);
					}
					await functions.sendAuthCodeEmail(
						this.parameters.email,
						authCode,
						auth_code_expiry,
					);
					this.message.push("Email sent.");
					this.success = true;
				} else {
					this.message.push("Email not found.");
					this.success = false;
				}
			} else {
				this.message.push("Invalid email.");
				this.success = false;
			}
		} else {
			this.message.push("Missing email.");
			this.success = false;
		}
	};
	verifyAuth = async () => {
		const authenticated: types.KeyValue = { value: false };
		if (Object.hasOwn(this.parameters, "email")) {
			if (validation.isEmail(this.parameters.email)) {
				let verifyQuery: types.KeyValue | null =
					await models.User.findOne({
						subQuery: false,
						attributes: [
							"id",
							"auth_code",
							"login_token",
							"auth_code_expires",
							"email",
						],
						where: {
							email: { [Op.eq]: this.parameters.email },
						},
						limit: 1,
						logging: (sql: string) => {
							this.queries.push(sql.toString());
							if (
								globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
									"debug" ||
								globalThis.globalVars.DEBUG_USER == "foobar"
							) {
								console.log(
									"(Auth) verifyAuth sql: " + sql.toString(),
								);
							}
						},
					});

				if (verifyQuery) {
					verifyQuery = (await functions.formatResults(
						verifyQuery,
					)) as types.KeyValue;
					const authCode = verifyQuery.auth_code;
					const expiry = moment.utc(verifyQuery.auth_code_expires);
					const emailCode = this.parameters.auth_code;
					const now = moment.utc();
					const updateObject = {} as types.KeyValue;

					if (expiry.isAfter(now)) {
						if (authCode == emailCode) {
							const newToken: string = uuidv6()
								.toLocaleUpperCase()
								.toString();
							updateObject.auth_code = null;
							updateObject.auth_code_expires = null;
							updateObject.login_token = newToken;
							const jwtToken = await functions.generateJWT({
								user_id: verifyQuery.id.toString(),
								login_token: await functions.encryptHash(
									newToken.toString(),
								),
							});

							this.output.token = JSON.stringify({
								user_id: verifyQuery.id.toString(),
								user_jwt: jwtToken,
							});

							this.sqlObject = {};
							this.sqlObject.user_id = verifyQuery.id;
							this.sqlObject.user_date =
								this.parameters.user_date;
							this.sqlObject.action = 1;
							if (this.parameters.user_agent) {
								this.sqlObject.user_agent =
									this.parameters.user_agent;
							}
							if (this.parameters.ip_address) {
								this.sqlObject.ip_address =
									this.parameters.ip_address;
							}
							if (this.parameters.latitude) {
								this.sqlObject.latitude =
									this.parameters.latitude;
							}
							if (this.parameters.longitude) {
								this.sqlObject.longitude =
									this.parameters.longitude;
							}
							await models.Login.create(this.sqlObject, {
								logging: (sql: string) => {
									this.queries.push(sql.toString());
								},
							});

							this.message.push("Authenticated.");
							this.success = true;

							authenticated.value = true;
						} else {
							this.message.push("Incorrect code.");
							this.success = false;

							authenticated.value = false;
							this.status = 400;
						}
					} else {
						updateObject.auth_code = null;
						updateObject.auth_code_expires = null;
						updateObject.login_token = null;
						this.message.push("Code expired.");
						this.success = false;
						this.status = 400;
						authenticated.value = false;
					}

					if (Object.keys(updateObject).length > 0) {
						await models.User.update(updateObject, {
							where: {
								id: { [Op.eq]: verifyQuery.id },
							},
							logging: (sql: string) => {
								this.queries.push(sql.toString());
							},
						});
					}
				} else {
					this.message.push("Not User Found.");
					this.success = false;

					authenticated.value = false;
				}
			} else {
				this.message.push("Invalid Email.");
				this.success = false;

				authenticated.value = false;
			}
		} else {
			this.message.push("Missing Email.");
			this.success = false;

			authenticated.value = false;
		}
		this.output.authenticated = authenticated.value;
		delete this.results;
	};
	logoutAuth = async () => {
		if (await functions.verifyJWT(this.parameters.user_jwt)) {
			const decodedToken: types.KeyValue | undefined =
				await functions.decodeJWT(this.parameters.user_jwt);
			if (decodedToken) {
				const logoutQuery = await models.User.findOne({
					subQuery: false,
					raw: true,
					nest: true,
					where: {
						id: { [Op.eq]: decodedToken.user_id },
						login_token: {
							[Op.eq]: await functions.decryptHash(
								decodedToken.login_token,
							),
						},
					},
					limit: 1,
					logging: (sql: string) => {
						this.queries.push(sql.toString());
					},
				});
				if (logoutQuery && Object.keys(logoutQuery).length > 0) {
					// // insert login log
					this.sqlObject = {};
					this.sqlObject.user_id = this.parameters.user_id;
					this.sqlObject.user_date = this.parameters.user_date;
					this.sqlObject.action = 2;
					await models.Login.create(this.sqlObject, {
						logging: (sql: string) => {
							this.queries.push(sql.toString());
						},
					});

					this.message.push("Securely Logged Out.");
					this.success = true;
				}
			}
			delete this.results;
		}
	};
	testAuth = async () => {
		const authenticated: types.KeyValue = { value: false };
		const decodedToken: types.KeyValue | undefined =
			await functions.decodeJWT(this.parameters.user_jwt);
		if (decodedToken) {
			const testQuery: types.KeyValue | null = await models.User.findOne({
				subQuery: false,
				raw: true,
				nest: true,
				where: {
					id: { [Op.eq]: decodedToken.user_id },
					login_token: {
						[Op.eq]: await functions.decryptHash(
							decodedToken.login_token,
						),
					},
				},
				limit: 1,
				logging: (sql: string) => {
					this.queries.push(sql.toString());
				},
			});
			if (testQuery) {
				if (testQuery.id == this.parameters.user_id) {
					authenticated.value = true;
				}
			} else {
				authenticated.value = false;
			}
		}
		if (authenticated.value) {
			this.success = true;
			this.output.authenticated = authenticated.value;
			delete this.results;
		} else {
			this.success = false;
			this.status = 403;
			this.message.push("Unauthorized.");
			delete this.results;
		}
	};
	generateAuthCode = (): string => {
		const auth_code_length: number = parseInt(
			process.env.AUTH_CODE_LENGTH || "6",
		);
		const digits: number[] = [];
		while (digits.length < auth_code_length) {
			digits.push(randomInt(9) as unknown as never);
		}
		return digits.join("");
	};
	registerAuth = async () => {
		if (
			Object.hasOwn(this.parameters, "email") &&
			Object.hasOwn(this.parameters, "password")
		) {
			if (validation.isEmail(this.parameters.email)) {
				const createUserResult = await functions.createUser(this, true);
				if (createUserResult) {
					this.parameters = createUserResult.parameters;
					this.message = createUserResult.message || [];
					this.results = createUserResult.results;
					this.queries = createUserResult.queries;
				} else {
					this.message.push("Failed to create user.");
					this.success = false;
				}
			}
		}
	};
	task = async (): Promise<any> => {
		const path: types.KeyValue = {
			value: this.req.path.toString().replace("/", ""),
		};

		switch (path.value) {
			case "login-auth":
				await this.loginAuth();
				break;
			case "verify-auth":
				await this.verifyAuth();
				break;
			case "logout-auth":
				await this.logoutAuth();
				break;
			case "test-auth":
				await this.testAuth();
				break;
			case "registeration":
				await this.registerAuth();
				break;
			default:
				throw new Error("Invalid task");
				break;
		}
	};
}
export { AuthAction };
