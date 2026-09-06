import * as types from "../types";
import * as validation from "../validation";
import axios, { Axios, AxiosResponse } from "axios";
import { loadEnv } from "./loadEnv";
import * as functions from "./index";

loadEnv();
const protocol: string = process.env.PROTOCOL || "http";	
const portTemp: string = process.env.HTTP_PORT || "9876";
const port: number = parseInt(portTemp);
const backendURL: string = protocol + "://localhost:" + port;

// // example usage - setting user to unavailable
// const requestParams: types.KeyValue = {};
// Hash-based ID conversion was removed; raw IDs now pass through.
// await functions.apiRequest("POST", "/cycle-user-status", requestParams);

async function apiRequest(
	context: types.HelperContext | undefined,
	method: string,
	baseURL: string = backendURL,
	path: string = "/",
	parameters: types.KeyValue | FormData = {},
	timeout: number = 0,
): Promise<any> {
	context = functions.initializeContext(context);
	const api = axios.create({
		baseURL: baseURL,
		timeout: timeout,
	});

	if (api !== undefined) {
		const axiosConfig: types.KeyValue = {};
		const headers: types.KeyValue = {};
		headers["Content-Type"] = "application/json";

		axiosConfig.headers = headers;

		const env: types.KeyValue = {};
		env.GLOBAL_DEBUG_LEVEL = process.env.GLOBAL_DEBUG_LEVEL;
		env.DEBUG_USER = process.env.DEBUG_USER;
		// Keep env metadata on both JSON and multipart payloads while avoiding unsafe union property access.
		if (parameters instanceof FormData) {
			parameters.append("env", JSON.stringify(env));
		} else {
			parameters.env = env;
		}

		axiosConfig.method = method.toUpperCase();
		axiosConfig.url = path;
		if (method.toUpperCase() !== "GET") {
			axiosConfig.data = parameters as types.KeyValue;
		}
		// switch (method) {
		// 	case "POST":
		// 		axiosConfig.method = method.toUpperCase();
		// 		axiosConfig.url = path;
		// 		axiosConfig.data = parameters as types.KeyValue;
		// 		break;
		// 	case "PUT":
		// 		axiosConfig.method = method.toUpperCase();
		// 		axiosConfig.url = path;
		// 		axiosConfig.data = parameters as types.KeyValue;
		// 		break;
		// 	case "DELETE":
		// 		axiosConfig.method = method.toUpperCase();
		// 		axiosConfig.url = path;
		// 		axiosConfig.data = parameters as types.KeyValue;
		// 		break;
		// 	case "GET":
		// 		axiosConfig.method = method.toUpperCase();
		// 		axiosConfig.url = path;
		// 		break;
		// 	default:
		// 		break;
		// }
		// axiosConfig.method = method;
		// axiosConfig.url = path;
		// axiosConfig.data = parameters;
		const response = await api
			?.request(axiosConfig)
			.then(async response => {
				// console.log("API response", JSON.parse(JSON.stringify(response)));
				let responseData = response.data;
				if (
					typeof responseData === "string" &&
					validation.isJSON(responseData)
				) {
					responseData = JSON.parse(responseData);
				}
				return responseData;
			})
			.catch(async (error: any): Promise<any> => {
				console.error("LLM API request error: ", error);
				const errorMessage: string[] = [];
				const responseData = error.response?.data;

				if (responseData?.error) {
					if (Array.isArray(responseData.error)) {
						errorMessage.push(...responseData.error);
					} else {
						errorMessage.push(String(responseData.error));
					}
				} else if (error.message) {
					errorMessage.push(error.message);
				}

				if (responseData?.message) {
					if (Array.isArray(responseData.message)) {
						errorMessage.push(...responseData.message);
					} else {
						errorMessage.push(String(responseData.message));
					}
				}

				for (const message of errorMessage) {
					context.message.push(message);
				}
				context.success = false;
				context.success_object[apiRequest.name] = false;
				return { success: false, message: errorMessage };
			});
		context.success = response?.status === "success" ? true : false;
		context.success_object[apiRequest.name] = response?.status === "success" ? true : false;
		return response;
	} else {
		context.success = false;
		context.success_object[apiRequest.name] = false;
		context.message.push("Unable to make API request.");
		return context;
	}
}

export { apiRequest };
