/**
 * Parse a request parameter intended for Sequelize `[Op.in]` filters into a number array.
 *
 * Why this exists:
 * - Express query parsing can produce arrays for repeated params (e.g. `?read=0&read=1` -> ["0","1"]).
 * - Downstream code previously called `JSON.parse` on these values, which coerces arrays to "0,1" and throws.
 *
 * This helper accepts:
 * - number[] / string[] (including repeated query params)
 * - JSON strings like "[0,1]"
 * - comma-separated strings like "0,1"
 * - single values like "0" or 0
 *
 * NOTE: This intentionally avoids importing validation/functions to prevent circular deps.
 */
function parseSqlIn(value: any, defaultValue: number[] = [0]): number[] {
	if (value === undefined || value === null || value === "") {
		return defaultValue;
	}

	let list: any[] = [];

	if (Array.isArray(value)) {
		list = value;
	} else if (typeof value === "number") {
		list = [value];
	} else if (typeof value === "boolean") {
		list = [value ? 1 : 0];
	} else if (typeof value === "string") {
		const trimmed: string = value.trim();
		if (trimmed === "") {
			return defaultValue;
		}

		// Try JSON first if it looks like JSON; otherwise allow comma-separated lists.
		let jsonParsed: any = null;
		if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith('"') || trimmed === "0" || trimmed === "1") {
			try {
				jsonParsed = JSON.parse(trimmed);
			} catch (error: any) {
				if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
					console.error("parseSqlIn error: ", error);
				}
				jsonParsed = null;
			}
		}

		if (Array.isArray(jsonParsed)) {
			list = jsonParsed;
		} else if (jsonParsed !== null && jsonParsed !== undefined) {
			list = [jsonParsed];
		} else if (trimmed.includes(",")) {
			list = trimmed.split(",");
		} else {
			list = [trimmed];
		}
	} else {
		list = [value];
	}

	const parsed: number[] = [];
	for (const item of list) {
		if (item === undefined || item === null || item === "") {
			continue;
		}
		const n: number = typeof item === "number" ? item : parseInt(String(item).trim(), 10);
		if (!Number.isNaN(n)) {
			parsed.push(n);
		}
	}

	if (parsed.length === 0) {
		return defaultValue;
	}
	return parsed;
}

export { parseSqlIn };
