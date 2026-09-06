// This declares the shared env-backed global so TypeScript accepts globalThis.globalVars everywhere.
declare global {
	var globalVars: import("./KeyValue").KeyValue;
}

export {};
