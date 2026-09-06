import { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import * as models from "../models";
import moment from "moment-timezone";
import { Op, Sequelize } from "sequelize";
import { loadEnv } from "../functions/loadEnv";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend( timezone );

//debug
import { getChalk } from "../functions/getChalk";
import util from "util";
loadEnv();
// Use the CommonJS-safe chalk loader to prevent ERR_REQUIRE_ESM in ts-node runtime.
const chalk = getChalk();
class ErrorLogAction extends GenericAction {
	getErrorLog = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}

		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: [
				["id", "error_log_id"],
				"created",
				"message",
				"line",
				"file",
				"url",
				"user_ip",
				"user_agent",
				"resolved",
				"stack",
				"environment",
				"type",
			],
			order: this.parameters.order,
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			if (Object.hasOwn(models.ErrorLog.getAttributes(), "deleted")) {
				whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
			}
		}

		if (Object.hasOwn(this.parameters, "error_log_id")) {
			if (this.parameters.error_log_id) {
				if (Object.hasOwn(models.ErrorLog.getAttributes(), "id")) {
					whereTemp.push({
						id: { [Op.eq]: this.parameters.error_log_id },
					});
				}
			}
		}

		if (this.parameters.resolved) {
			whereTemp.push({ resolved: { [Op.in]: this.parameters.resolved } });
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (Object.hasOwn(this.parameters, "timezone")) {
					if (this.parameters.timezone) {
						this.parameters.start = moment(this.parameters.start)
							.tz(this.parameters.timezone)
							.format();
						this.parameters.end = moment(this.parameters.end)
							.tz(this.parameters.timezone)
							.format();
					}
				}
				if (Object.hasOwn(models.ErrorLog.getAttributes(), "created")) {
					whereTemp.push(
						Sequelize.where(Sequelize.col("created"), {
							[Op.gte]: moment(this.parameters.start).format(
								"YYYY-MM-DD HH:mm:ss",
							),
							[Op.lte]: moment(this.parameters.end).format(
								"YYYY-MM-DD HH:mm:ss",
							),
						}),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (Object.hasOwn(models.ErrorLog.getAttributes(), "message")) {
					keywordWhere.push({
						message: {
							// iLike keeps keyword search case-insensitive on Postgres (MySQL LIKE used a case-insensitive collation).
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.ErrorLog.getAttributes(), "file")) {
					keywordWhere.push({
						file: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.ErrorLog.getAttributes(), "url")) {
					keywordWhere.push({
						url: { [Op.iLike]: "%" + this.parameters.keyword + "%" },
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
				models.ErrorLog,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				// console.log("ErrorLogAction.get sql: " + sql.toString());
			},
		});

		this.results = await models.ErrorLog.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = ["error_log_id"];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}
		this.success = true;
	};

	getRequestLog = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		if (!this.parameters.order) {
			this.parameters.order = '[["created", "DESC"]]';
		}

		if (validation.isJSON(this.parameters.order)) {
			this.parameters.order = JSON.parse(this.parameters.order);
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: [
				["id", "request_log_id"],
				"created",
				"origin",
				"user_agent",
				"parameters",
				"path",
				"method",
				"ip_address",
				"geo_location",
			],
			order: this.parameters.order,
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			if (Object.hasOwn(models.RequestLog.getAttributes(), "deleted")) {
				whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
			}
		}

		if (Object.hasOwn(this.parameters, "request_log_id")) {
			if (this.parameters.request_log_id) {
				if (Object.hasOwn(models.RequestLog.getAttributes(), "id")) {
					whereTemp.push({
						id: { [Op.eq]: this.parameters.request_log_id },
					});
				}
			}
		}

		if (
			Object.hasOwn(this.parameters, "start") &&
			Object.hasOwn(this.parameters, "end")
		) {
			if (this.parameters.start && this.parameters.end) {
				if (Object.hasOwn(this.parameters, "timezone")) {
					if (this.parameters.timezone) {
						this.parameters.start = moment(this.parameters.start)
							.tz(this.parameters.timezone)
							.format();
						this.parameters.end = moment(this.parameters.end)
							.tz(this.parameters.timezone)
							.format();
					}
				}
				if (
					Object.hasOwn(models.RequestLog.getAttributes(), "created")
				) {
					whereTemp.push(
						Sequelize.where(Sequelize.col("created"), {
							[Op.gte]: moment(this.parameters.start).format(
								"YYYY-MM-DD HH:mm:ss",
							),
							[Op.lte]: moment(this.parameters.end).format(
								"YYYY-MM-DD HH:mm:ss",
							),
						}),
					);
				}
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				if (
					Object.hasOwn(models.RequestLog.getAttributes(), "method")
				) {
					keywordWhere.push({
						method: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (Object.hasOwn(models.RequestLog.getAttributes(), "path")) {
					keywordWhere.push({
						path: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				if (
					Object.hasOwn(models.RequestLog.getAttributes(), "origin")
				) {
					keywordWhere.push({
						origin: {
							[Op.iLike]: "%" + this.parameters.keyword + "%",
						},
					});
				}
				// if (Object.hasOwn(models.RequestLog.getAttributes(), "parameters")) {
				// 	keywordWhere.push({ parameters: { [Op.iLike]: "%" + this.parameters.keyword + "%" } });
				// }
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
				models.RequestLog,
				this.sequelizeOptions,
				this.parameters,
			);
			this.sequelizeOptions = this.paginationResult.sequelizeOptions;
			this.page = this.paginationResult.page;
		}

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
				if (
					(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
					globalThis.globalVars.DEBUG_USER == "foobar"
				) {
					console.log(
						chalk.blue("getRequestLog sql: " + sql.toString()),
					);
				}
			},
		});

		this.results = await models.RequestLog.findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			const formatFields = ["request_log_id"];
			this.results = await functions.formatResults(
				this.results,
				formatFields,
			);
		}
		this.success = true;
	};
	save = async (modelArray: types.KeyValue[] = []) => {
		if (modelArray.length > 0) {
			this.modelArray = modelArray;
		}

		this.sqlObject = {};
		const masterValidation = await validation.validateAll(
			this,
			models.ErrorLog,
			this.sqlObject,
			this.parameters,	
		);
		if (masterValidation) {
			const updateSQL = await models.ErrorLog.update(this.sqlObject, {
				where: {
					id: { [Op.eq]: this.parameters.error_log_id },
				},
				logging: (sql: string) => {
					this.queries.push(sql);
					if (
						(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
								"info") ||
						globalThis.globalVars.DEBUG_USER == "foobar"
					) {
						console.log(
							chalk.blue(
								"ErrorLogAction.save sql: " + sql.toString(),
							),
						);
					}
				},
			});
			if (updateSQL) {
				this.success = true;

				this.message.push(models.ErrorLog.name.trim() + " updated.");
			}
		}
		delete this.results;
	};
	add = async (modelArray: types.KeyValue[] = []) => {
		const errorContext = await functions.createError(
			this as types.HelperContext,
			this.parameters,
			"frontend",
		);
		// Copy success flag from createError context to this action
		this.success = errorContext.success;
		delete this.results;
	};

	task = async (): Promise<any> => {
		const pathTask: string = this.req.path.toString().replace("/", "");

		switch (pathTask) {
			case "add-errorlog":
				await this.add();
				break;
			case "save-errorlog":
				await this.save();
				break;
			case "delete-errorlog":
				await this.delete([models.ErrorLog]);
				break;
			case "get-errorlog":
				await this.getErrorLog();
				break;
			case "get-requestlog":
				await this.getRequestLog();
				break;
			default:
				throw new Error("Invalid Task: " + pathTask);
				break;
		}
	};
}
export { ErrorLogAction };
