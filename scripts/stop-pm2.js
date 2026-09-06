#!/usr/bin/env node

const path = require("path");
const { execFileSync } = require("child_process");
const { loadProjectEnv } = require("./utils/loadProjectEnv");

const appRoot = path.resolve(__dirname, "..");

// Load PM2_APP from project .env, including when the login shell exported an empty value.
const envLoadResult = loadProjectEnv();

const pm2AppName = (process.env.PM2_APP || "").trim();

function run(command, args, options = {}) {
	try {
		return execFileSync(command, args, {
			stdio: options.inherit ? "inherit" : "pipe",
			encoding: "utf8",
		});
	} catch (error) {
		return null;
	}
}

function listPm2Processes() {
	const output = run("pm2", ["jlist"]);
	if (output === null) {
		return [];
	}

	try {
		const parsed = JSON.parse(output || "[]");
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		return [];
	}
}

// Match by configured name or by this repo's cwd/script so renamed apps (e.g. sz-api) still stop.
function isPm2ProcessForApp(proc, options = {}) {
	const configuredName = (options.pm2AppName || "").trim();
	const root = path.resolve(options.appRoot || appRoot);
	const name = String(proc?.name || "");
	const cwd = proc?.pm2_env?.pm_cwd
		? path.resolve(String(proc.pm2_env.pm_cwd))
		: "";
	const execPath = String(
		proc?.pm2_env?.pm_exec_path || proc?.pm2_env?.script || "",
	);
	const resolvedExec = execPath ? path.resolve(execPath) : "";

	if (configuredName && name === configuredName) {
		return true;
	}

	if (cwd && cwd === root) {
		return true;
	}

	if (resolvedExec === path.join(root, "dist", "index.js")) {
		return true;
	}

	if (
		resolvedExec.startsWith(`${root}${path.sep}`) &&
		resolvedExec.endsWith(`${path.sep}dist${path.sep}index.js`)
	) {
		return true;
	}

	return false;
}

function stopPm2Process(name) {
	// High-risk operation: stops and deletes a PM2-managed backend process for this deploy.
	run("pm2", ["stop", name]);
	run("pm2", ["delete", name]);
}

function main() {
	const processes = listPm2Processes();
	if (processes.length === 0) {
		if (!pm2AppName) {
			if (!envLoadResult.loaded) {
				console.log(
					"PM2_APP is not set because project .env was not found; skipping npm run stop:pm2.",
				);
			} else {
				console.log("No PM2 processes found; nothing to stop.");
			}
		} else {
			console.log(`PM2 app not found: ${pm2AppName}`);
		}
		process.exit(0);
		return;
	}

	const matches = processes.filter(proc =>
		isPm2ProcessForApp(proc, { pm2AppName, appRoot }),
	);

	if (matches.length === 0) {
		if (pm2AppName) {
			console.log(`PM2 app not found: ${pm2AppName}`);
		} else {
			console.log("No PM2 processes matched this app directory.");
		}
		process.exit(0);
		return;
	}

	const stoppedNames = [];
	for (const proc of matches) {
		const name = String(proc.name || "").trim();
		if (!name || stoppedNames.includes(name)) {
			continue;
		}

		console.log(
			`Stopping PM2 process for this app: ${name} (pid ${proc.pid || "unknown"}).`,
		);
		stopPm2Process(name);
		stoppedNames.push(name);
	}

	run("pm2", ["save"]);
	console.log(`PM2 app stopped: ${stoppedNames.join(", ")}`);
}

if (require.main === module) {
	main();
}

module.exports = {
	isPm2ProcessForApp,
};
