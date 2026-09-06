import * as types from "../types";

function isNumeric(text: any): boolean {
	const returnValue: types.KeyValue = { value: false };
	try {
		returnValue.value = !isNaN(parseFloat(text)) && isFinite(text);
	} catch (error: any) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("isNumeric error: ", error);
		}
		// console.error("isJSON error:", error);
		returnValue.value = false;
	} finally {
		return returnValue.value;
	}
}

export { isNumeric };
