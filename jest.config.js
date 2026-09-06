module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/**/__tests__/**",
		"!src/index.ts",
		"!src/app.ts",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/helpers/setup.ts"],
	testTimeout: 10000,
	verbose: true,
};

