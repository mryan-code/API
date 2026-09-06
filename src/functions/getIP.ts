import * as types from "../types";
import * as functions from "./index";
async function getIP(log: boolean = true) {
	const returnValue: types.KeyValue = { value: null };
	try {
		const response: types.KeyValue = await fetch("https://api.ipify.org?format=json");
		const data: types.KeyValue = await response.json();
		returnValue.value = data.ip;
	} catch (error: any) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("getIP error: ", error);
		}
		await functions.createError(this, error);
		returnValue.value = null;
	} finally {
		return returnValue.value;
	}
}
export { getIP };
