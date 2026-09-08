import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
	shouldCopyFile,
	collectCopyableFiles,
	toDestPath,
	copyProjectFiles,
} = require("../../../scripts/copy-files.js");

describe("copy-files script helpers", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "copy-files-"));
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test("shouldCopyFile keeps html, css, and js assets", () => {
		expect(shouldCopyFile("swagger.js")).toBe(true);
		expect(shouldCopyFile("page.HTML")).toBe(true);
		expect(shouldCopyFile("theme.css")).toBe(true);
		expect(shouldCopyFile("index.ts")).toBe(false);
		expect(shouldCopyFile("readme.md")).toBe(false);
	});

	test("toDestPath strips the src root the way copyfiles -u 1 did", () => {
		const srcRoot = path.join(tempDir, "src");
		const destRoot = path.join(tempDir, "dist");
		expect(toDestPath(path.join(srcRoot, "swagger.js"), srcRoot, destRoot)).toBe(
			path.join(destRoot, "swagger.js"),
		);
		expect(
			toDestPath(path.join(srcRoot, "nested", "theme.css"), srcRoot, destRoot),
		).toBe(path.join(destRoot, "nested", "theme.css"));
	});

	test("copyProjectFiles copies matching assets and skips other files", () => {
		const srcRoot = path.join(tempDir, "src");
		const destRoot = path.join(tempDir, "dist");
		fs.mkdirSync(path.join(srcRoot, "nested"), { recursive: true });
		fs.writeFileSync(path.join(srcRoot, "swagger.js"), "window.swagger = 1;");
		fs.writeFileSync(path.join(srcRoot, "nested", "theme.css"), "body {}");
		fs.writeFileSync(path.join(srcRoot, "page.html"), "<html></html>");
		fs.writeFileSync(path.join(srcRoot, "index.ts"), "export {};");

		const copied = copyProjectFiles(srcRoot, destRoot);
		const copiedNames = copied.map((filePath: string) =>
			path.relative(srcRoot, filePath),
		);

		expect(copiedNames.sort()).toEqual(
			["nested/theme.css", "page.html", "swagger.js"].sort(),
		);
		expect(fs.readFileSync(path.join(destRoot, "swagger.js"), "utf8")).toBe(
			"window.swagger = 1;",
		);
		expect(fs.readFileSync(path.join(destRoot, "nested", "theme.css"), "utf8")).toBe(
			"body {}",
		);
		expect(fs.existsSync(path.join(destRoot, "index.ts"))).toBe(false);
	});

	test("collectCopyableFiles walks nested directories", () => {
		const srcRoot = path.join(tempDir, "src");
		fs.mkdirSync(path.join(srcRoot, "a", "b"), { recursive: true });
		fs.writeFileSync(path.join(srcRoot, "a", "b", "ok.js"), "ok");
		fs.writeFileSync(path.join(srcRoot, "a", "skip.ts"), "skip");

		const files = collectCopyableFiles(srcRoot);
		expect(files).toEqual([path.join(srcRoot, "a", "b", "ok.js")]);
	});
});
