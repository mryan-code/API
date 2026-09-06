import { Request, Response, NextFunction } from "express";
import * as models from "../models";
import * as types from "../types";
import * as functions from "../functions";
import { CronJob } from "cron";
import { Model, Op } from "sequelize";
import fs from "node:fs";
import moment from "moment-timezone";
import { loadEnv } from "../functions/loadEnv";

loadEnv();

// // dayjs
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// dayjs.extend(utc);
// dayjs.extend(timezone);

//debug
import util from "util";
import { getChalk } from "../functions/getChalk";
const chalk = getChalk();

const directory: string = "cleanup";
let cronJobsInitialized: boolean = false;
let deleteRequestLogsRunning: boolean = false;

const cronRequest = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	// async function uploadFileToS3(
	// 	fileName: string,
	// 	dataBuffer: Buffer,
	// ): Promise<void> {
	// 	try {
	// 		const s3 = new S3Client({
	// 			region: process.env.AWS_REGION,
	// 		});
	// 		const command = new PutObjectCommand({
	// 			Bucket: process.env.AWS_BUCKET,
	// 			Key: fileName,
	// 			Body: dataBuffer,
	// 			ContentType: "text/csv",
	// 		});
	// 		const response: PutObjectCommandOutput = await s3.send(command);
	// 		if (
	// 			(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
	// 			globalThis.globalVars.DEBUG_USER == "foobar"
	// 		) {
	// 			console.log("uploadFileToS3 response: ", response);
	// 		}
	// 		if (response) {
	// 			fs.unlink(directory + "/" + fileName, (err: any) => {
	// 				if (err) {
	// 					if (
	// 						globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 						(globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
	// 							"errors" ||
	// 							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
	// 								"warnings" ||
	// 							globalThis.globalVars.GLOBAL_DEBUG_LEVEL ==
	// 								"info")
	// 					) {
	// 						console.error("delete file error: ", err);
	// 					}
	// 				}
	// 			});
	// 			if (
	// 				(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 					globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
	// 				globalThis.globalVars.DEBUG_USER == "foobar"
	// 			) {
	// 				console.log("file deleted: ", fileName);
	// 			}
	// 		}
	// 	} catch (error: any) {
	// 		if (
	// 			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
	// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
	// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
	// 		) {
	// 			console.error("uploadFileToS3 error: ", error);
	// 		}
	// 	}
	// }

	// async function createCsvFile(
	// 	fileName: string,
	// 	sequelizeResults: types.KeyValue[],
	// ): Promise<Buffer | void> {
	// 	try {
	// 		const parser = new Parser();
	// 		const csv = parser.parse(sequelizeResults);
	// 		fs.writeFileSync(directory + "/" + fileName, csv, "utf-8");
	// 		return fs.readFileSync(directory + "/" + fileName);
	// 	} catch (error: any) {
	// 		if (
	// 			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
	// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
	// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
	// 		) {
	// 			console.error("createCsvFile error: ", error);
	// 		}
	// 	}
	// }
	// async function task(
	// 	model: Model,
	// 	type: string,
	// 	sequelizeOptions: types.KeyValue,
	// 	timeFrameUnit: moment.unitOfTime.StartOf = "month",
	// 	timeFrameValue: number = 3,
	// ): Promise<void> {
	// 	const dt: moment.Moment = moment.utc();
	// 	const fileName: string =
	// 		type +
	// 		"_logs~" +
	// 		dt
	// 			.subtract(
	// 				timeFrameValue * 2,
	// 				timeFrameUnit as unknown as moment.unitOfTime.DurationConstructor,
	// 			)
	// 			.startOf("day")
	// 			.toISOString() +
	// 		" - " +
	// 		dt
	// 			.subtract(
	// 				timeFrameValue,
	// 				timeFrameUnit as unknown as moment.unitOfTime.DurationConstructor,
	// 			)
	// 			.startOf("day")
	// 			.toISOString() +
	// 		".csv";
	// 	let sequelizeResults: types.KeyValue[] = await (model as any).findAll(
	// 		sequelizeOptions,
	// 	);
	// 	if (process.env.NODE_ENV === "prod") {
	// 		if (sequelizeResults.length > 0) {
	// 			sequelizeResults = (await functions.formatResults(
	// 				sequelizeResults,
	// 			)) as types.KeyValue[];
	// 			await createCsvFile(fileName, sequelizeResults).then(
	// 				async (dataBuffer: Buffer | void) => {
	// 					if (dataBuffer) {
	// 						await uploadFileToS3(fileName, dataBuffer);
	// 						await (model as any).destroy(sequelizeOptions);
	// 					}
	// 				},
	// 			);
	// 		}
	// 	} else {
	// 		if (sequelizeResults.length > 0) {
	// 			sequelizeResults = (await functions.formatResults(
	// 				sequelizeResults,
	// 			)) as types.KeyValue[];
	// 			await (model as any).destroy(sequelizeOptions);
	// 		}
	// 	}
	// }

	// async function deleteRequestLogs(): Promise<void> {
	// 	const timeFrameUnit: moment.unitOfTime.StartOf = "month";
	// 	const timeFrameValue: number = 3;
	// 	const dt: moment.Moment = moment.utc();
	// 	const fileName: string =
	// 		"request_logs~" +
	// 		dt
	// 			.subtract(timeFrameValue * 2, timeFrameUnit)
	// 			.startOf("day")
	// 			.toISOString() +
	// 		" - " +
	// 		dt
	// 			.subtract(timeFrameValue, timeFrameUnit)
	// 			.startOf("day")
	// 			.toISOString() +
	// 		".csv";
	// 	const sequelizeOptions: types.KeyValue = {
	// 		where: {
	// 			[Op.and]: [
	// 				{
	// 					resolved: {
	// 						[Op.eq]: 1,
	// 					},
	// 				},
	// 				{
	// 					created: {
	// 						[Op.lte]: dt
	// 							.subtract(timeFrameValue, timeFrameUnit)
	// 							.startOf("day")
	// 							.toISOString(),
	// 					},
	// 				},
	// 			],
	// 		},
	// 		logging: (sql: string) => {
	// 			if (
	// 				(globalThis.globalVars.GLOBAL_DEBUG == "true" &&
	// 					globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
	// 				globalThis.globalVars.DEBUG_USER == "foobar"
	// 			) {
	// 				console.log("cronRequest sql (RequestLog.findAll): " + sql);
	// 			}
	// 		},
	// 	};
	// 	await task(
	// 		models.RequestLog as unknown as Model<any>,
	// 		"request",
	// 		sequelizeOptions,
	// 		timeFrameUnit,
	// 		timeFrameValue,
	// 	);
	// }

	// if (!cronJobsInitialized) {
	// 	cronJobsInitialized = true;

	// 	CronJob.from({
	// 		cronTime: "0 0 0 1 1,3,6,9 *",
	// 		onTick: async () => {
	// 			if (deleteRequestLogsRunning) {
	// 				return;
	// 			}

	// 			deleteRequestLogsRunning = true;
	// 			try {
	// 				// Prevent overlapping cleanup runs without adding per-request EventEmitter listeners.
	// 				await deleteRequestLogs();
	// 			} finally {
	// 				deleteRequestLogsRunning = false;
	// 			}
	// 		},
	// 		start: true,
	// 		timeZone: "UTC",
	// 	});
	// }

	next();
};

export { cronRequest };
