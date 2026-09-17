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
		let picturePuzzleImages: types.KeyValue[] =
			await models.PicturePuzzleImage.findAll({
				attributes: {
					include: [["id", "picture_puzzle_image_id"]],
					exclude: ["id"],
				},
				where: {
					deleted: 0,
				},
			});
		if (picturePuzzleImages.length > 0) {
			picturePuzzleImages = (await functions.formatResults(
				picturePuzzleImages,
			)) as types.KeyValue[];
			this.success = true;
			this.message.push("Picture puzzle images retrieved successfully");
			this.results = picturePuzzleImages;
		} else {
			this.success = false;
			this.message.push("Failed to retrieve picture puzzle images");
		}
	};

	uploadPicturePuzzleImage = async (): Promise<any> => {
		try {
			if (
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "debug" ||
				globalThis.globalVars.DEBUG_USER == "mryan"
			) {
				console.log(
					"(Portfolio) uploadPicturePuzzleImage parameters: ",
					this.parameters,
				);
			}
			if (await functions.verifyJWT(this.parameters.user_jwt)) {
				const decodedToken: types.KeyValue | undefined =
					await functions.decodeJWT(this.parameters.user_jwt);
				if (decodedToken?.user_id) {
					const imageBuffer = fs.readFileSync(
						this.parameters.file.path,
					);
					const base64Data = imageBuffer.toString("base64");
					this.sqlObject = {};
					this.sqlObject.blob = base64Data;
					this.sqlObject.mime_type = this.parameters.file.mimetype;
					this.sqlObject.user_id = decodedToken.user_id;
					if (
						globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "debug" ||
						globalThis.globalVars.DEBUG_USER == "mryan"
					) {
						console.log(
							"(Portfolio) uploadPicturePuzzleImage sqlObject: ",
							this.sqlObject,
						);
					}
					const masterValidation = await validation.validateAll(
						this,
						models.PicturePuzzleImage,
						this.sqlObject,
						this.parameters,
					);
					if (masterValidation) {
						const insertSQL: types.KeyValue =
							await models.PicturePuzzleImage.create(
								this.sqlObject,
								{
									logging: (sql: string) => {
										this.queries.push(sql.toString());
										if (
											globalThis.globalVars
												.GLOBAL_DEBUG_LEVEL ==
												"debug" ||
											globalThis.globalVars.DEBUG_USER ==
												"mryan"
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
							this.results = [insertSQL];
						} else {
							this.success = false;
							this.message.push(
								"Failed to upload picture puzzle image",
							);
						}
					}
				} else {
					this.success = false;
					this.message.push("Unauthorized");
				}
			} else {
				this.success = false;
				this.message.push("Unauthorized");
			}
		} catch (error) {
			console.error("Error uploading picture puzzle image", error);
			throw new Error("Error uploading picture puzzle image");
		}
	};
}
export { PortfolioAction };
