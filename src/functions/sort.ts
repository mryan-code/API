import * as types from "../types";

function sortByKeyAlpha(a: types.KeyValue, b: types.KeyValue, key: string, log: boolean = true) {
	return a[key].localeCompare(b[key]);
}
function sortAlpha(a: types.KeyValue, b: types.KeyValue, log: boolean = true) {
	return a.localeCompare(b);
}
function sortNumericByKey(a: types.KeyValue, b: types.KeyValue, key: string, log: boolean = true) {
	if (a[key] < b[key]) {
		return -1;
	}
	if (a[key] > b[key]) {
		return 1;
	}
	return 0;
}

export { sortAlpha, sortNumericByKey, sortByKeyAlpha };
