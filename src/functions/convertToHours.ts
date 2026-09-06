import * as types from "../types";

function convertToHours(seconds: number, log: boolean = true) {
	const returnValue: types.KeyValue = { value: seconds / (60 * 60) };
	return returnValue.value.toFixed(2);
}

export { convertToHours };
