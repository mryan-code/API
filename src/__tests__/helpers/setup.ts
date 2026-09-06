// Jest setup placeholder.
// This file exists because jest.config.js references setupFilesAfterEnv at src/__tests__/helpers/setup.ts.

if (!globalThis.globalVars) {
	globalThis.globalVars = process.env;
}
