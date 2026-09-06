import { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import * as models from "../models";
import moment from "moment";
import { Op, Sequelize, QueryTypes } from "sequelize";
import { loadEnv } from "../functions/loadEnv";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

loadEnv();
class UserAction extends GenericAction {
	task = async (): Promise<any> => {
		const path = this.req.path.toString().replace("/", "");
		switch (path) {
			case "add-user":
				await this.add();
				break;
			case "save-user":
				await this.save();
				break;
			case "delete-user":
				await this.delete([models.User]);
				break;
			case "get-user":
				await this.get([models.User, models.Role]);
				break;
			default:
				throw new Error("Invalid task: " + path);
				break;
		}
	};
	get = async (modelArray: types.KeyValue[] = []) => {
		let sqlWhere: types.KeyValue = {};

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
			order: this.parameters.order,
			attributes: [
				["id", "user_id"],
				"email",
				"avatar",
				"first_name",
				"last_name",
				"deleted",
				"timezone",
			],
		};

		const whereTemp: types.KeyValue[] = [];
		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "id")) {
			if (this.parameters.id) {
				whereTemp.push({ id: { [Op.eq]: this.parameters.id } });
			}
		}

		if (Object.hasOwn(this.parameters, "users")) {
			if (this.parameters.users) {
				whereTemp.push({ id: { [Op.in]: this.parameters.users } });
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				keywordWhere.push({
					first_name: {
						// iLike keeps keyword search case-insensitive on Postgres (MySQL LIKE used a case-insensitive collation).
						[Op.iLike]: "%" + this.parameters.keyword + "%",
					},
				});
				keywordWhere.push({
					last_name: {
						[Op.iLike]: "%" + this.parameters.keyword + "%",
					},
				});
				keywordWhere.push({
					email: { [Op.iLike]: "%" + this.parameters.keyword + "%" },
				});
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		sqlWhere = {};
		if (whereTemp.length > 0) {
			sqlWhere = { [Op.and]: whereTemp };
			Object.assign(this.sequelizeOptions, {
				where: sqlWhere,
			});
		}

		Object.assign(this.sequelizeOptions, {
			include: [
				{
					model: models.Role,
					through: {
						attributes: [],
					},
					attributes: [["id", "role_id"]],
					required: false,
					where: {
						deleted: { [Op.eq]: 0 },
					},
				},
			],
		});

		Object.assign(this.sequelizeOptions, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		});
		this.results = await this.modelArray[0].findAll(this.sequelizeOptions);
		if (this.results.length > 0) {
			// this.results = await functions.rawArray(this.results);
			this.results = await functions.formatResults(this.results, [
				"user_id",
				"role_id",
			]);
		}

		this.success = true;
	};
	add = async () => {
		// const masterValidation = await validation.validateAll(
		// 	this,
		// 	models.User,
		// 	this.sqlObject,
		// 	this.parameters,
		// );
		// if (masterValidation) {
		// 	const insertSQL: any = await models.User.create(this.sqlObject, {
		// 		logging: (sql: string) => {
		// 			this.queries.push(sql.toString());
		// 		},
		// 	});

		// 	if (insertSQL) {
		// 		// Insert the new role
		// 		this.sqlObject = {};
		// 		this.sqlObject.role_id = 4;
		// 		this.sqlObject.user_id = insertSQL.id;
		// 		await models.UserRole.create(this.sqlObject, {
		// 			logging: (sql: string) => {
		// 				this.queries.push(sql.toString());
		// 			},
		// 		});

		// 		this.sqlObject = {};
		// 		this.sqlObject.user_id = insertSQL.id;
		// 		await models.UserAvatar.create(this.sqlObject, {
		// 			logging: (sql: string) => {
		// 				this.queries.push(sql.toString());
		// 			},
		// 		});

		// 		this.success = true;

		// 		this.message.push(models.User.name.trim() + " Created.");
		// 	}
		// }
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
		delete this.results;
	};
	save = async () => {
		this.success = true;
		this.sqlObject = {};
		this.sqlObject.user_id = this.parameters.user_id;
		// Pass the full parameters object to updateUser, which will be validated and used for the update
		const updateUserResult = await functions.updateUser(
			this,
			this.parameters,
		);
		if (updateUserResult) {
			this.parameters = updateUserResult.parameters;
			this.message = updateUserResult.message || [];
			this.results = updateUserResult.results;
			this.queries = updateUserResult.queries;
		}

		// send user updated websocket message
		const websocketMessage: types.KeyValue = {};
		websocketMessage["type"] = "user_updated";
		websocketMessage["user"] = this.results.user;
		await functions.sendWebsocket(this, websocketMessage);

		delete this.results;
	};
}
export { UserAction };
