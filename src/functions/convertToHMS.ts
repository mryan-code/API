import * as types from "../types";
import moment from "moment";
function convertToHMS(intSeconds: number, log: boolean = true) {
	const returnValue: types.KeyValue = { value: "" };
	// Create a duration from the seconds directly to handle 24+ hours correctly
	const objDuration = moment.duration(intSeconds, "seconds");
	// Format hours, minutes, seconds with zero padding
	const hours = Math.floor(objDuration.asHours());
	const minutes = objDuration.minutes();
	const seconds = objDuration.seconds();
	returnValue.value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	return returnValue.value;
}

export { convertToHMS };
