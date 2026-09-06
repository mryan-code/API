import * as types from "../types";
import * as functions from "./index";
async function slugify(text: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		returnValue.value = returnValue.value.toString().toLowerCase();
		returnValue.value = returnValue.value.replace(/[^\w ]+/g, "");
		returnValue.value = returnValue.value.replace(/ +/g, "-");
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("slugify error: ", error);
		}
		await functions.createError(this, error);
		returnValue.value = null;
	} finally {
		return returnValue.value;
	}
}

async function fieldSlug(text: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		returnValue.value = returnValue.value.toString().toLowerCase();
		returnValue.value = returnValue.value.replace(/[\w]+[\.]/gm, "");
		returnValue.value = returnValue.value.replace(/[^a-zA-Z0-9]/g, " ");
		returnValue.value = returnValue.value.replace("id", "ID");
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("fieldSlug error: ", error);
		}
		await functions.createError(this, error);
		returnValue.value = null;
	} finally {
		return returnValue.value;
	}
}

async function titleify(text: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		// returnValue.value = returnValue.value.toString().toLowerCase();
		// // returnValue.value = returnValue.value.replace(/[\__id^]{3}/, "_ID");
		// // returnValue.value = returnValue.value.replace(/[\_]+/g, " ");
		// // returnValue.value = returnValue.value.replace(/[\-]+/g, " ");
		// returnValue.value = returnValue.value.charAt(0).toUpperCase() + returnValue.value.slice(1);
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("titleify error: ", error);
		}
		await functions.createError(this, error);
		returnValue.value = null;
	} finally {
		return returnValue.value;
	}
}

async function renameDialerObject(text: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		// Add underscores before capital letters (except the first character)
		// This handles camelCase conversion: "MyTestCase" -> "My_Test_Case"
		returnValue.value = returnValue.value
			.toString()
			.replace(/([a-z])([A-Z])/g, "$1_$2");
		// Also handle consecutive capitals: "XMLHttpRequest" -> "XML_Http_Request"
		returnValue.value = returnValue.value.replace(
			/([A-Z]+)([A-Z][a-z])/g,
			"$1_$2",
		);

		// Replace special characters with underscores to separate words
		// Digits are preserved so model names like UserP2 keep numeric suffixes.
		returnValue.value = returnValue.value.replace(/[^a-zA-Z0-9_]/g, "_");

		// Convert to lowercase
		returnValue.value = returnValue.value.toLowerCase();

		// Replace multiple consecutive underscores with a single underscore
		returnValue.value = returnValue.value.replace(/_{2,}/g, "_");

		// Remove leading and trailing underscores
		returnValue.value = returnValue.value.replace(/^_+|_+$/g, "");

		// // Add a prefix of "tbl" to the value
		// returnValue.value = "tbl" + returnValue.value;
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
		) {
			console.error("renameDialerObject error: ", error);
		}
		await functions.createError(this, error);
		returnValue.value = null;
	} finally {
		return returnValue.value;
	}
}
export { slugify, fieldSlug, titleify, renameDialerObject };
