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
import { getChalk } from "../functions/getChalk";
import { loadEnv } from "../functions/loadEnv";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

const chalk = getChalk();
import util from "util";

loadEnv();
class PageAction extends GenericAction {
	get = async () => {
		const whereTemp: types.KeyValue[] = [];

		const deletedParam: types.KeyValue = { value: [0] };
		if (Object.hasOwn(this.parameters, "show_deleted")) {
			if (this.parameters.show_deleted === true) {
				deletedParam.value = [0, 1];
			}
			whereTemp.push({ deleted: { [Op.in]: deletedParam.value } });
		}

		if (Object.hasOwn(this.parameters, "page_id")) {
			if (this.parameters.page_id) {
				whereTemp.push({ id: { [Op.eq]: this.parameters.page_id } });
			}
		}

		if (Object.hasOwn(this.parameters, "section_id")) {
			if (this.parameters.section_id) {
				whereTemp.push({ id: { [Op.eq]: this.parameters.section_id } });
			}
		}

		if (Object.hasOwn(this.parameters, "keyword")) {
			if (this.parameters.keyword) {
				const keywordWhere: types.KeyValue[] = [];
				keywordWhere.push({
					name: {
						// iLike keeps keyword search case-insensitive on Postgres (MySQL LIKE used a case-insensitive collation).
						[Op.iLike]: "%" + this.parameters.keyword + "%",
					},
				});
				if (keywordWhere.length > 0) {
					whereTemp.push({ [Op.or]: keywordWhere });
				}
			}
		}

		let sqlWhere: types.KeyValue = {};
		if (Object.entries(whereTemp).length > 0) {
			sqlWhere = { [Op.and]: whereTemp };
		}

		this.sequelizeOptions = {
			subQuery: false,
			attributes: [
				["id", "page_id"],
				"name",
				"deleted",
				"location",
				"icon",
				"auth_required",
				"auth_level",
				["order", "parent_order"],
				"section_id",
				"slug",
				"path",
				"file",
			],
			where: { [Op.and]: [sqlWhere, { section_id: { [Op.eq]: null } }] },
			order: [["parent_order", "ASC"]],
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		let pageResult: types.KeyValue[] = (await models.Page.findAll(
			this.sequelizeOptions,
		)) as types.KeyValue[];
		if (pageResult.length > 0) {
			pageResult = (await functions.formatResults(pageResult, [
				"page_id",
				"section_id",
			])) as types.KeyValue[];
		}
		// console.log("PageAction.get pageResult: ", util.inspect(pageResult, { depth: null, colors: true }));

		this.sequelizeOptions = {
			subQuery: true,
			attributes: [
				["id", "section_id"],
				"name",
				"front_id",
				"auth_required",
				"auth_level",
				"icon",
				["order", "parent_order"],
			],
			include: [
				{
					model: models.Page,
					attributes: [
						["id", "page_id"],
						"name",
						"deleted",
						"location",
						"icon",
						"auth_required",
						"auth_level",
						["order", "page_order"],
						"section_id",
						"slug",
						"path",
						"file",
					],
					where: sqlWhere,
				},
			],
			order: [
				["order", "ASC"],
				[{ model: models.Page }, "order", "ASC"],
			],
			logging: (sql: string) => {
				this.queries.push(sql.toString());
			},
		};

		let sectionResult: types.KeyValue[] = (await models.Section.findAll(
			this.sequelizeOptions,
		)) as types.KeyValue[];
		if (sectionResult.length > 0) {
			sectionResult = (await functions.formatResults(sectionResult, [
				"section_id",
				"page_id",
				"front_id",
			])) as types.KeyValue[];
		}
		// console.log("PageAction.get sectionResult: ", util.inspect(sectionResult, { depth: null, colors: true }));

		this.results = [...pageResult, ...sectionResult];
		this.results.sort(
			(a: types.KeyValue, b: types.KeyValue) =>
				a.parent_order - b.parent_order,
		);
		// console.log("PageAction.get results: ", this.results);
		this.success = true;
	};

	task = async (): Promise<any> => {
		const pathTask: string = this.req.path.toString().replace("/", "");

		switch (pathTask) {
			case "get-page":
				await this.get();
				break;
			default:
				throw new Error("Invalid Task: " + pathTask);
				break;
		}
	};
}
export { PageAction };
