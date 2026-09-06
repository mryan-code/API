const path = require("path");

describe("stop-pm2 helpers", () => {
	const { isPm2ProcessForApp } = require("../../../scripts/stop-pm2.js");
	const appRoot = "/Users/inkt/Personal/API";

	test("matches configured PM2_APP name", () => {
		expect(
			isPm2ProcessForApp(
				{ name: "api", pm2_env: {} },
				{ pm2AppName: "api", appRoot },
			),
		).toBe(true);
	});

	test("matches renamed app by cwd even when PM2_APP differs", () => {
		expect(
			isPm2ProcessForApp(
				{
					name: "sz-api",
					pm2_env: {
						pm_cwd: appRoot,
						pm_exec_path: path.join(appRoot, "dist", "index.js"),
					},
				},
				{ pm2AppName: "api", appRoot },
			),
		).toBe(true);
	});

	test("matches by dist/index.js path under app root", () => {
		expect(
			isPm2ProcessForApp(
				{
					name: "legacy",
					pm2_env: {
						pm_exec_path: path.join(appRoot, "dist", "index.js"),
					},
				},
				{ pm2AppName: "api", appRoot },
			),
		).toBe(true);
	});

	test("does not match unrelated PM2 apps", () => {
		expect(
			isPm2ProcessForApp(
				{
					name: "other-app",
					pm2_env: {
						pm_cwd: "/tmp/other",
						pm_exec_path: "/tmp/other/dist/index.js",
					},
				},
				{ pm2AppName: "api", appRoot },
			),
		).toBe(false);
	});
});
