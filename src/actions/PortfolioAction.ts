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
		console.log("uploadPicturePuzzleImage", this.parameters);
		// const picturePuzzleImage = await models.PicturePuzzleImage.create({
		// 	blob: this.parameters.blob,
		// 	user_id: this.parameters.user_id,
		// });
	};
}
export { PortfolioAction };
