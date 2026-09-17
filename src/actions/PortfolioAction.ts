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
import fs from "node:fs";
import { Blob } from "node:buffer";

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

loadEnv();
class PortfolioAction extends GenericAction {
	task = async (): Promise<any> => {
		const path = this.req.path.toString().replace("/", "");
		switch (path) {
			case "get-picture-puzzle-image":
				await this.getPicturePuzzleImage();
				break;
			case "upload-picture-puzzle-image":
				await this.uploadPicturePuzzleImage();
				break;
			default:
				throw new Error("Invalid task: " + path);
				break;
		}
	};

	getPicturePuzzleImage = async (): Promise<any> => {
		const picturePuzzleImage = await models.PicturePuzzleImage.findAll({
			where: {
				deleted: 0,
			},
		});
	};

	uploadPicturePuzzleImage = async (): Promise<any> => {
		console.log("uploadPicturePuzzleImage- parameters", this.parameters);

		try {
			const imageBuffer = fs.readFileSync(this.parameters.file.path);
			if (
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "debug" ||
				globalThis.globalVars.DEBUG_USER == "mryan"
			) {
				console.log(
					"(Portfolio) uploadPicturePuzzleImage imageBuffer: " +
						imageBuffer.toString(),
				);
			}
			const blob = new Blob([imageBuffer], {
				type: this.parameters.file.mimetype,
			});
			this.sqlObject.blob = blob;
			this.sqlObject.mime_type = this.parameters.file.mimetype;
			this.sqlObject.user_id = this.parameters.user_id;
			this.sqlObject = {};
			console.log("sqlObject", this.sqlObject);

			const masterValidation = await validation.validateAll(
				this,
				models.PicturePuzzleImage,
				this.sqlObject,
				this.parameters,
			);
			if (masterValidation) {
				const insertSQL: any = await models.PicturePuzzleImage.create(
					this.sqlObject,
					{
						logging: (sql: string) => {
							this.queries.push(sql.toString());
							if (
								globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
									"debug" ||
								globalThis.globalVars.DEBUG_USER == "foobar"
							) {
								console.log(
									"(Portfolio) uploadPicturePuzzleImage sql: " +
										sql.toString(),
								);
							}
						},
					},
				);
				if (insertSQL) {
					this.success = true;
					this.message.push(
						"Picture puzzle image uploaded successfully",
					);
					this.results.picture_puzzle_image = insertSQL;
				} else {
					this.success = false;
					this.message.push("Failed to upload picture puzzle image");
				}
			}
		} catch (error) {
			console.error("Error uploading picture puzzle image", error);
			throw new Error("Error uploading picture puzzle image");
		}
	};
}
export { PortfolioAction };
