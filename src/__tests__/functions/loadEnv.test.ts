import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const trackedKeys: string[] = [
	"DB_USER",
	"DB_PASS",
	"DB_HOST",
	"DB_PORT",
	"DB_NAME",
	"DOTENV_PATH",
];

const originalEnv: Record<string, string | undefined> = {};

function snapshotEnv(): void {
	for (const key of trackedKeys) {
		originalEnv[key] = process.env[key];
	}
}

function restoreEnv(): void {
	for (const key of trackedKeys) {
		if (originalEnv[key] === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = originalEnv[key];
		}
	}
}

function loadEnvFresh(): () => void {
	jest.resetModules();
	return require("../../functions/loadEnv").loadEnv as () => void;
}

describe("loadEnv", () => {
	let tempDir: string;

	beforeAll(() => {
		snapshotEnv();
	});

	beforeEach(() => {
		restoreEnv();
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "loadenv-"));
	});

	afterEach(() => {
		restoreEnv();
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test("fills empty database keys from DOTENV_PATH", () => {
		const envPath: string = path.join(tempDir, ".env");
		fs.writeFileSync(
			envPath,
			"DB_USER='deploy_user'\nDB_PASS='deploy_pass'\nDB_HOST='127.0.0.1'\nDB_PORT='5432'\nDB_NAME='deploy_db'\n",
		);
		process.env.DOTENV_PATH = envPath;
		process.env.DB_USER = "";
		process.env.DB_PASS = "";
		process.env.DB_HOST = "";
		process.env.DB_PORT = "";
		process.env.DB_NAME = "";

		const loadEnv = loadEnvFresh();
		loadEnv();

		expect(process.env.DB_USER).toBe("deploy_user");
		expect(process.env.DB_PASS).toBe("deploy_pass");
		expect(process.env.DB_HOST).toBe("127.0.0.1");
		expect(process.env.DB_PORT).toBe("5432");
		expect(process.env.DB_NAME).toBe("deploy_db");
	});

	test("does not overwrite a non-empty existing database key", () => {
		const envPath: string = path.join(tempDir, ".env");
		fs.writeFileSync(envPath, "DB_USER='file_user'\n");
		process.env.DOTENV_PATH = envPath;
		process.env.DB_USER = "shell_user";

		const loadEnv = loadEnvFresh();
		loadEnv();

		expect(process.env.DB_USER).toBe("shell_user");
	});

	test("is a no-op on the second call in the same module instance", () => {
		const firstPath: string = path.join(tempDir, "first.env");
		const secondPath: string = path.join(tempDir, "second.env");
		fs.writeFileSync(firstPath, "DB_HOST='first-host'\n");
		fs.writeFileSync(secondPath, "DB_HOST='second-host'\n");
		delete process.env.DB_HOST;
		process.env.DOTENV_PATH = firstPath;

		const loadEnv = loadEnvFresh();
		loadEnv();
		process.env.DOTENV_PATH = secondPath;
		delete process.env.DB_HOST;
		loadEnv();

		expect(process.env.DB_HOST).toBeUndefined();
	});
});
