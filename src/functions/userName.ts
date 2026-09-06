import * as types from "../types";

async function userName(nameArray: string[], log: boolean = true) {
	const returnValue: types.KeyValue = { value: nameArray.join(" ") };
	try {
		let name: string = "";
		for (const nameTemp of nameArray) {
			if (nameTemp) {
				name += nameTemp + " ";
			}
		}
		returnValue.value = name.trim();
	} catch (error: any) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
			console.error("userName error: ", error);
		}
		returnValue.value = nameArray.join(" ");
	} finally {
		return returnValue.value;
	}
}

export { userName };
