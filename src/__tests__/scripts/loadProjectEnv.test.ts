import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const trackedKeys: string[] = ["DB_USER", "PM2_APP", "DOTENV_PATH"];
const originalEnv: Record<string, string | undefined> = {};

function snapshotEnv(): void {
	for ( const key of trackedKeys ) {
		originalEnv[key] = process.env[key];
	}
}

function restoreEnv(): void {
	for ( const key of trackedKeys ) {
		if ( originalEnv[key] === undefined ) {
			delete process.env[key];
		} else {
			process.env[key] = originalEnv[key];
		}
	}
}

describe("loadProjectEnv", () => {
	let tempDir: string;

	beforeAll(() => {
		snapshotEnv();
	});

	beforeEach(() => {
		restoreEnv();
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "load-project-env-"));
	});

	afterEach(() => {
		restoreEnv();
		fs.rmSync(tempDir, { recursive: true, force: true });
		jest.resetModules();
	});

	test("fills empty PM2_APP and DB_USER from DOTENV_PATH", () => {
		const envPath: string = path.join(tempDir, ".env");
		fs.writeFileSync(envPath, "PM2_APP='sz-api'\nDB_USER='deploy_user'\n");
		process.env.DOTENV_PATH = envPath;
		process.env.PM2_APP = "";
		process.env.DB_USER = "";

		const { loadProjectEnv } = require("../../../scripts/utils/loadProjectEnv");
		loadProjectEnv();

		expect(process.env.PM2_APP).toBe("sz-api");
		expect(process.env.DB_USER).toBe("deploy_user");
	});
});
