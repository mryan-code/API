"use strict";

// node-llama-cpp is ESM-only and its module graph uses top-level await, so
// this CommonJS build cannot require() it (ERR_REQUIRE_ASYNC_MODULE), and
// TypeScript downlevels any import() written in a .ts file to require().
// This file is plain JavaScript: tsc never compiles it, so the import()
// below stays a genuine dynamic import at runtime. scripts/copy-files.js
// copies it verbatim to dist/loaders/ as part of the build.
let llamaCppModulePromise = null;

function loadLlamaCpp() {
	if (!llamaCppModulePromise) {
		llamaCppModulePromise = import("node-llama-cpp");
	}
	return llamaCppModulePromise;
}

module.exports = { loadLlamaCpp };
