import * as types from "../types";
function convertToPercent(onlineTime: number, callTime: number, log: boolean = true) {
	const returnValue: types.KeyValue = { value: 0 };
	if (callTime > 0) {
		returnValue.value = (onlineTime / callTime) * 100;
	}
	return parseFloat(returnValue.value.toFixed(2));
}

export { convertToPercent };
