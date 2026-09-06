import * as types from "../types";

function isEmail(email: any): boolean {
	const returnValue: types.KeyValue = { value: false };
	try {
		const emailRegex = /^[a-zA-Z0-9\.\_\%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
		if (emailRegex.test(email)) {
			returnValue.value = true;
		} else {
			returnValue.value = false;
		}
	} catch (error: any) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("isEmail error: ", error);
		}
		returnValue.value = false;
	} finally {
		return returnValue.value;
	}
}

export { isEmail };
