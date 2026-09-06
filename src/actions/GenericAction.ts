import { Request, Response } from "express";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import * as models from "../models";
import moment from "moment-timezone";
import { Op, Sequelize } from "sequelize";
import axios, { Axios, AxiosResponse } from "axios";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

//debug
import util from "util";
import { getChalk } from "../functions/getChalk";
import { glob } from "fs";
const chalk = getChalk();

class GenericAction {
	public output: types.KeyValue = {};
	public parameters: types.KeyValue = {};
	public message: string[] = [];
	public queries: any[] = [];
	public results: any = [];
	public success: boolean = false;
	// Action instances double as helper contexts, so they need per-helper success flags.
	public success_object: types.KeyValue = {};
	public page: types.KeyValue = {};
	public status: number = 400;
	public authorized: boolean = false;
	public requestUserQuery: any = null;
	public logObjectID: any = null;
	public logObject: string = "";
	public logNote: string = "";
	public logTask: string = "";
	public permissionRequired: boolean = false;
	public modelArray: types.KeyValue[] = [];
	public req: Request;
	public res: Response;
	public sqlObject: types.KeyValue = {};
	public sqlWhere: types.KeyValue = {};
	public sqlQuery: any = null;
	public sqlInstance: any = null;
	public sqlInsert: types.KeyValue = {};
	public sqlUpdate: types.KeyValue = {};
	public websocketMessage: types.KeyValue = {};
	public userQuery: types.KeyValue = {};
	public departmentQuery: types.KeyValue = {};
	public companyQuery: types.KeyValue = {};
	public formatFields: string[] = [];
	public callbackURL: string = "";
	public logUserID: number = 0;
	public sequelizeOptions: types.KeyValue = {};
	public paginationResult: types.KeyValue = {};
	public startTimer: moment.Moment = moment.utc();
	public authToken: string | null = null;
	public totalRows: number = 0;
	constructor(
		req: Request,
		res: Response,
		permissionRequired: boolean,
		modelArray: types.KeyValue[] = [],
	) {
		// Deprecated code (kept for reference): direct body assignment can be undefined in some requests.
		// this.parameters = req.body;
		// Guard against undefined bodies to prevent request_user access crashes.
		this.parameters = req.body ?? {};
		this.message = [];
		this.results = [];
		this.queries = [];
		this.success = false;
		this.success_object = {};
		this.page = {};
		this.requestUserQuery = null;
		this.logObjectID = null;
		this.logNote = "";
		this.logObject = "";
		this.logTask = "";
		this.logUserID = 0;
		this.permissionRequired = permissionRequired;
		this.modelArray = modelArray;
		this.req = req;
		this.res = res;
		this.websocketMessage = {};
		this.userQuery = {};
		this.sqlQuery = null;
		this.sqlObject = {};
		this.sqlUpdate = {};
		this.sqlInsert = {};
		this.sqlWhere = {};
		this.formatFields = ["id"];
		this.sequelizeOptions = {};
		this.paginationResult = {};
		this.totalRows = 0;
		this.startTimer = moment.utc();
		this.authToken = req.headers.authorization?.split(" ")[1] || null;
		if (this.authToken) {
			this.authToken = this.authToken.replace("Bearer ", "");
		}
	}
	getAll = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}
		await this.get(this.modelArray);
	};
	add = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		this.sqlObject = {};
		const masterValidation = await validation.validateAll(
			this,
			this.modelArray[0],
			this.sqlObject,
			this.parameters,
		);
		if (masterValidation) {
			let insertSQL: any = await this.modelArray[0].create(
				this.sqlObject,
				{
					logging: (sql: string) => {
						this.queries.push(sql);
					},
				},
			);

			if (insertSQL) {
				let formmattedResults: types.KeyValue[] =
					(await this.modelArray[0].findAll({
						attributes: {
							include: [
								[
									"id",
									(await functions.renameDialerObject(
										this.modelArray[0].name.trim(),
										false,
									)) + "_id",
								],
							],
							exclude: ["id"],
						},
						where: {
							id: { [Op.eq]: insertSQL.id },
						},
					})) as unknown as types.KeyValue[];
				if (formmattedResults.length > 0) {
					// formatResults can return a single object or an array, so normalize to array for safe iteration.
					const firstPassResults =
						await functions.formatResults(formmattedResults);
					if (Array.isArray(firstPassResults)) {
						formmattedResults = firstPassResults;
					} else if (firstPassResults) {
						formmattedResults = [firstPassResults];
					} else {
						formmattedResults = [];
					}
					const formattedFields: string[] = [];
					for await (const result of formmattedResults) {
						for await (const [key, value] of Object.entries(
							result,
						)) {
							if (
								key.endsWith("_id") &&
								!formattedFields.includes(key)
							) {
								formattedFields.push(key);
							}
						}
					}
					const secondPassResults = await functions.formatResults(
						formmattedResults,
						formattedFields,
					);
					if (Array.isArray(secondPassResults)) {
						formmattedResults = secondPassResults;
					} else if (secondPassResults) {
						formmattedResults = [secondPassResults];
					} else {
						formmattedResults = [];
					}
					this.results = formmattedResults;
				}
				this.success = true;

				this.message.push(this.modelArray[0].name.trim() + " Created.");
			}
		}
	};
	save = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		this.sqlObject = {};

		const masterValidation = await validation.validateAll(
			this,
			this.modelArray[0],
			this.sqlObject,
			this.parameters,
		);
		if (masterValidation) {
			const updateSQL = await this.modelArray[0].update(this.sqlObject, {
				where: {
					id: { [Op.eq]: this.parameters.id },
				},
				logging: (sql: string) => {
					this.queries.push(sql);
				},
			});
			if (updateSQL) {
				this.success = true;

				this.message.push(this.modelArray[0].name.trim() + " updated.");
			}
		}
		delete this.results;
	};
	delete = async (modelArray: types.KeyValue[] = []) => {
		let deleteValue: number = 1;
		let deletePrefix: string = "";
		let deleteSuffix: string = "";
		let deleteSelectQuery: types.KeyValue = {};
		let deleteDestroyQuery: types.KeyValue = {};
		let deleteUpdateQuery: types.KeyValue = {};

		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		const globalVars = globalThis as any;
		if (Object.hasOwn(this.modelArray[0].getAttributes(), "deleted")) {
			deleteSelectQuery = await this.modelArray[0].findOne({
				subQuery: false,
				raw: true,
				attributes: ["deleted"],
				where: {
					id: { [Op.eq]: this.parameters.id },
				},
				limit: 1,
				logging: (sql: string) => {
					this.queries.push(sql);
				},
			});

			if (deleteSelectQuery) {
				if (
					deleteSelectQuery.deleted == "1" ||
					deleteSelectQuery.deleted == 1
				) {
					deleteValue = 0;
					deletePrefix = "un";
				}
			}

			deleteUpdateQuery = await this.modelArray[0].update(
				{
					deleted: deleteValue,
				},
				{
					where: {
						id: { [Op.eq]: this.parameters.id },
					},
					logging: (sql: string) => {
						this.queries.push(sql);
					},
				},
			);
			if (deleteUpdateQuery) {
				deleteSuffix = "(soft)";
			}
		} else {
			deleteDestroyQuery = await this.modelArray[0].destroy({
				where: {
					id: { [Op.eq]: this.parameters.id },
				},
				logging: (sql: string) => {
					this.queries.push(sql);
				},
			});
			if (deleteDestroyQuery) {
				deleteSuffix = "(hard)";
			}
		}

		if (deleteUpdateQuery || deleteDestroyQuery) {
			this.success = true;

			this.message.push(
				this.modelArray[0].name.trim() +
					" " +
					deletePrefix +
					"deleted" +
					deleteSuffix +
					".",
			);
		} else {
			this.message.push(
				"Unable to " +
					deletePrefix +
					"delete " +
					this.modelArray[0].name.trim() +
					".",
			);
			this.success = false;
		}
		delete this.results;
	};
	get = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		if (!this.parameters.order) {
			this.parameters.order = '[["id", "DESC"]]';
		}
		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: {
				include: [
					[
						"id",
						(await functions.renameDialerObject(
							this.modelArray[0].name.trim(),
							false,
						)) + "_id",
					],
				],
				exclude: ["id"],
			},
			order: this.parameters.order,
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				if (
					globalThis.globalVars.GLOBAL_DEBUG_LEVEL === "debug" ||
					globalThis.globalVars.DEBUG_USER === "mryan"
				) {
					console.log(
						"(Generic) " +
							this.modelArray[0].name.trim() +
							".get sql: " +
							sql.toString(),
					);
				}
			},
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			if (Object.hasOwn(this.modelArray[0].getAttributes(), "deleted")) {
				whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
			}
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				if (Object.hasOwn(this.modelArray[0].getAttributes(), "id")) {
					whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (
					Object.hasOwn(this.modelArray[0].getAttributes(), "created")
				) {
					if (Object.hasOwn(this.parameters, "timezone")) {
						if (this.parameters.timezone) {
							this.parameters.start = moment(
								this.parameters.start,
							)
								.tz(this.parameters.timezone)
								.format();
							this.parameters.end = moment(this.parameters.end)
								.tz(this.parameters.timezone)
								.format();
						}
					}
					whereTemp.push(
						Sequelize.where(
							Sequelize.col(
								this.modelArray[0].name.trim() + ".created",
							),
							{
								[Op.gte]: moment(this.parameters.start).format(
									"YYYY-MM-DD HH:mm:ss",
								),
								[Op.lte]: moment(this.parameters.end).format(
									"YYYY-MM-DD HH:mm:ss",
								),
							},
						),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (Object.hasOwn(this.modelArray[0].getAttributes(), "name")) {
					keywordWhere.push({
						name: {
							// iLike keeps keyword search case-insensitive on Postgres (MySQL LIKE used a case-insensitive collation).
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(this.modelArray[0].getAttributes(), "note")) {
					keywordWhere.push({
						note: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		if (whereTemp.length > 0) {
			const sqlWhere: types.KeyValue = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		if (this.parameters.current_page) {
			this.paginationResult = await functions.pageFunction(
				this.modelArray[0],
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
				// 	console.log("(Generic) " + this.modelArray[0].name.trim() + ".get sql: " + sql.toString());
				// }
			},
		});

		this.results = await this.modelArray[0].findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = [
				(await functions.renameDialerObject(
					this.modelArray[0].name.trim(),
					false,
				)) + "_id",
				"department_id",
				"case_id",
				"lead_id",
				"user_id",
				"company_id",
				"phone_id",
				"role_id",
				"status_id",
				"workflow_id",
				"workflow_task_id",
			];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}

		this.success = true;
	};

	task = async (): Promise<any> => {
		const pathTask: string = this.req.path
			.toString()
			.replace("/", "")
			.split("-")[0];

		switch (pathTask) {
			case "add":
				await this.add();
				break;
			case "save":
				await this.save();
				break;
			case "delete":
				await this.delete();
				break;
			case "get":
				await this.get();
				break;
			case "getAll":
				await this.getAll();
				break;
			default:
				throw new Error("Invalid Task (" + pathTask + ")");
				break;
		}
	};
	public Action = async () => {
		let shouldSendResponse = true;
		try {
			if (this.permissionRequired === true) {
				const authorized = await middleware.testAuthorizationHeader(
					this.req,
					this.res,
				);
				if (this.res.headersSent || this.res.writableEnded) {
					shouldSendResponse = false;
					return;
				}
				if (authorized.value === false) {
					shouldSendResponse = false;
					return this.res
						.setHeader("Content-Type", "json")
						.status(authorized.code)
						.json({ message: authorized.message })
						.end();
				}
			}
			this.status = 200;
			await this.task();
		} catch (error: any) {
			this.success = false;
			console.error(
				chalk.red(
					"Error in GenericAction.Action(): " +
						util.inspect(
							error,
							false,
							null,
							true /* enable colors */,
						),
				),
			);
			this.status = 500;
			await functions.createError(this as types.HelperContext, error);
		} finally {
			if (!shouldSendResponse) {
				return;
			}
			this.output.success = this.success;
			this.output.status = this.status;
			this.output.parameters = this.parameters;
			this.output.queries = this.queries;
			this.output.request = {
				start_time: this.startTimer.format(),
				end_time: moment.utc().format(),
				duration:
					moment
						.utc()
						.diff(this.startTimer, "milliseconds")
						.toString() + " ms",
			};
			this.output.results = this.results;
			if (this.page) {
				this.output.page = this.page;
			}
			this.output.total_rows = this.totalRows;
			if (this.message.length > 0) {
				this.output.message = [...new Set(this.message)];
			}
			// Only send if the task did not already send a response (e.g. TwilioAction.getOutboundPhone validation or createApiKey).
			if (!this.res.headersSent) {
				this.res.status(this.status).send(this.output).end();
			}
			// Avoid double responses if an action already wrote to the response.
			if (this.res.headersSent || this.res.writableEnded) {
				return;
			}

			this.res.status(this.status).send(this.output).end();
		}
	};
}
export { GenericAction };
