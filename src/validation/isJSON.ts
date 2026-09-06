import * as types from "../types";

function isJSON(text: any): boolean {
	const returnValue: types.KeyValue = { value: false };
	try {
		JSON.parse(text);
		returnValue.value = true;
	} catch (error: any) {
		returnValue.value = false;
	} finally {
		return returnValue.value;
	}
}

export { isJSON };
