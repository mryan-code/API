import { Request, Response } from "express";
import { GenericAction } from "./GenericAction";
import * as types from "../types";
import * as functions from "../functions";
import * as data from "../data";
import * as validation from "../validation";
import * as middleware from "../middleware";
import * as models from "../models";
import moment from "moment";
import { Op, Sequelize } from "sequelize";
import { loadEnv } from "../functions/loadEnv";

loadEnv();
class UserRoleAction extends GenericAction {
	cycle = async () => {
		let sqlObject: types.KeyValue = {};

		// Delete the old
		const deleteSQL = await models.UserRole.destroy({
			where: {
				user_id: { [Op.eq]: this.parameters.user_id },
			},
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		});

		// Insert the new
		sqlObject = {};
		sqlObject.role_id = this.parameters.role_id;
		sqlObject.user_id = this.parameters.user_id;
		const cycleQuery = await models.UserRole.create(sqlObject, {
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		});
		if (cycleQuery) {
			this.success = true;

			this.message.push(models.UserRole.name.trim() + " updated.");

			// // send user updated websocket message
			// const websocketMessage: types.KeyValue = {};
			// websocketMessage["type"] = "user_role_updated";
			// websocketMessage["user"] = this.results.user;
			// await functions.sendWebsocket(this, websocketMessage);
		}
	};
	task = async () => {
		const path = this.req.path.toString().replace("/", "");
		switch (path) {
			case "cycle-user-role":
				await this.cycle();
				break;
			case "get-user-role":
				await this.get();
				break;
			default:
				throw new Error("Invalid Task: " + path);
				break;
		}
	};
}
export { UserRoleAction };
