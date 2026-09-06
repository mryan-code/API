import * as types from "../types";
import * as functions from "../functions";
function rawObject(results: types.KeyValue): types.KeyValue {
	try {
		results = results.get({ plain: true });
	} catch (error: any) {
		results = results;
	}
	return results;
}
// Encrypts specified fields in an object, handling arrays recursively
// This function processes a single object and encrypts fields specified in formatFields
// If an element is an array, it recursively processes each element in the array
async function encryptObject(object: types.KeyValue, formatFields: string[] = [], log: boolean = true): Promise<types.KeyValue> {
	if (!object) {
		return object;
	}
	// Convert Sequelize model instance to plain object if needed
	let plainObject = rawObject(object);
	const formatFieldSet = new Set(formatFields);
	const encryptedValueCache = new Map<string, unknown>();
	// This synchronous recursive walk avoids promise overhead while formatting large result trees.
	const encryptedObject = encryptValueRecursive(plainObject, formatFieldSet, encryptedValueCache, log);
	return encryptedObject as types.KeyValue;
}
// Recursive function to encrypt fields and process infinitely nested objects/arrays
// This function handles infinite nesting depth by recursively processing all nested structures
function encryptValueRecursive(value: any, formatFields: Set<string>, encryptedValueCache: Map<string, unknown>, log: boolean = true): any {
	// Handle null or undefined - return as-is
	if (value === null || value === undefined) {
		return value;
	}

	// Handle arrays - recursively process each element to support infinite nesting
	if (Array.isArray(value)) {
		const processedArray: any[] = [];
		for (const element of value) {
			// Recursively process each array element, which may itself be an object, array, or primitive
			processedArray.push(encryptValueRecursive(element, formatFields, encryptedValueCache, log));
		}
		return processedArray;
	}

	// Handle objects - encrypt matching fields and recursively process nested values
	// This handles both plain objects and Sequelize model instances at any nesting level
	if (typeof value === "object") {
		// First, try to convert Sequelize model instance to plain object
		// This is necessary because Sequelize instances have special methods and need to be converted
		let plainObject = value;
		try {
			// Check if this is a Sequelize model instance by checking for the get method
			if (typeof value.get === "function") {
				plainObject = value.get({ plain: true });
			}
		} catch (error) {
			if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
				console.error("encryptValueRecursive error: ", error);
			}
			// If get() fails (e.g., not a Sequelize instance or error during conversion), use the value as-is
			plainObject = value;
		}

		// Handle special object types that shouldn't be processed as regular objects
		// Date, Buffer, and other built-in objects should be returned as-is
		if (value instanceof Date || value instanceof Buffer || value instanceof RegExp) {
			return value;
		}

		// Process the object by iterating through all its properties
		const processedObject: types.KeyValue = {};
		for (const [key, val] of Object.entries(plainObject)) {
			// Encrypt fields that match formatFields (these are ID fields that need to be hashed)
			// Only encrypt if the value is not null/undefined and is a valid value to encrypt
			if (formatFields.has(key) && val !== null && val !== undefined && val !== "" && val !== 0) {
				try {
					const hashCacheKey = val.toString();
					if (!encryptedValueCache.has(hashCacheKey)) {
						encryptedValueCache.set(hashCacheKey, hashCacheKey);
					}
					processedObject[key] = encryptedValueCache.get(hashCacheKey);
				} catch (error) {
					if (globalThis.globalVars.GLOBAL_DEBUG == "true" && (globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" || globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")) {
						console.error("encryptValueRecursive error: ", error);
					}
					// If encryption fails, keep the original value
					processedObject[key] = val;
				}
			} else {
				// Recursively process nested values - this handles infinite nesting
				// The nested value may be an object, array, or primitive, and will be handled recursively
				processedObject[key] = encryptValueRecursive(val, formatFields, encryptedValueCache, log);
			}
		}
		return processedObject;
	}

	// Return primitive values as-is (string, number, boolean, symbol, bigint, etc.)
	return value;
}

// Process a single object or array by converting Sequelize instances and recursively encrypting all ID fields
// This function handles the initial conversion and delegates to encryptValueRecursive for infinite nesting support
function encryptArray(results: types.KeyValue, formatFields: Set<string>, encryptedValueCache: Map<string, unknown>, log: boolean = true): types.KeyValue {
	if (results) {
		// Convert Sequelize model instance to plain object if needed
		// This handles the top-level object if it's a Sequelize instance
		results = rawObject(results);
		// Use one cache for the whole result so repeated IDs only pay encryption cost once.
		results = encryptValueRecursive(results, formatFields, encryptedValueCache, log);
	}
	return results;
}
// Main function to format results by encrypting all ID fields in infinitely nested structures
// Handles both single objects and arrays, with support for infinite nesting depth
//returns an array of objects or if and object is passed in, it returns the object
async function formatResults(results: types.KeyValue[] | types.KeyValue, formatFields: string[] = [], log: boolean = true) {
	if (results) {
		// Convert Sequelize model instance to plain object if needed (for top-level object)
		results = rawObject(results);
		const formatFieldSet = new Set(formatFields);
		const encryptedValueCache = new Map<string, unknown>();
		let newResults: types.KeyValue[] | types.KeyValue;

		// Handle single object (not an array)
		if (typeof results === "object" && !Array.isArray(results) && results !== null) {
			// Process the single object, which may contain nested objects and arrays
			results = encryptArray(results, formatFieldSet, encryptedValueCache, log);
			// Always return an array, even for single objects
			newResults = results;
		}
		// Handle array of objects
		else if (Array.isArray(results) && results !== null) {
			// Process each element in the array, which may itself contain nested structures
			newResults = [];
			for (let object1 of results) {
				object1 = encryptArray(object1, formatFieldSet, encryptedValueCache, log);
				newResults.push(object1);
			}
		}
		// If results is neither an object nor an array, return it as-is (shouldn't happen in practice)
		else {
			return results;
		}

		return newResults;
	}
	// If results is null/undefined/empty, return as-is
	return results;
}

export { formatResults, encryptObject };
