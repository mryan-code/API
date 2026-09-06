#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { loadProjectEnv } = require("./utils/loadProjectEnv");

// Load PM2_APP from project .env, including when the login shell exported an empty value.
const envLoadResult = loadProjectEnv();

const pm2AppName = (process.env.PM2_APP || "").trim();

if (!pm2AppName) {
	if (!envLoadResult.loaded) {
		console.log("PM2_APP is not set because project .env was not found; skipping npm run stop:pm2.");
	} else {
		console.log("PM2_APP is not set; skipping npm run stop:pm2.");
	}
	process.exit(0);
}

function run(command, args) {
	try {
		execFileSync(command, args, {
			stdio: "pipe",
			encoding: "utf8",
		});
		return true;
	} catch (error) {
		return false;
	}
}

if (!run("pm2", ["describe", pm2AppName])) {
	console.log(`PM2 app not found: ${pm2AppName}`);
	process.exit(0);
}

// High-risk operation: stops and deletes the remote PM2-managed backend process.
run("pm2", ["stop", pm2AppName]);
run("pm2", ["delete", pm2AppName]);
run("pm2", ["save"]);

console.log(`PM2 app stopped: ${pm2AppName}`);
