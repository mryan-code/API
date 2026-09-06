#!/usr/bin/env node

const path = require("path");
const { execFileSync } = require("child_process");
const { loadProjectEnv } = require("./utils/loadProjectEnv");

const appRoot = path.resolve(__dirname, "..");
const deployLogPath = path.join(appRoot, "deploy-start.log");

// Load PM2_APP from project .env, including when the login shell exported an empty value.
loadProjectEnv();

const pm2AppName = (process.env.PM2_APP || "").trim();

if (!pm2AppName) {
	console.error("PM2_APP is required to run npm run start:pm2.");
	process.exit(1);
}

try {
	execFileSync(
		"pm2",
		[
			"start",
			"dist/index.js",
			"--name",
			pm2AppName,
			"--cwd",
			appRoot,
			"--time",
			"--update-env",
			"--merge-logs",
			"--output",
			deployLogPath,
			"--error",
			deployLogPath,
			"-f",
		],
		{
			stdio: "inherit",
		},
	);

	// High-risk operation: persists PM2 process list on the host to survive reboots.
	execFileSync("pm2", ["save"], {
		stdio: "inherit",
	});

	console.log(`PM2 app started: ${pm2AppName}`);
} catch (error) {
	console.error("Failed to start PM2 app.");
	process.exit(1);
}
