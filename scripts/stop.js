#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const defaultHttpPort = "9876";
const envPath = path.join(__dirname, "..", ".env");
const appRoot = path.resolve(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run");
const stopSignal = process.env.STOP_SIGNAL || "SIGTERM";

function readEnvHttpPort() {
	try {
		const envContent = fs.readFileSync(envPath, "utf8");
		const httpPortLine = envContent
			.split(/\r?\n/)
			.find(line => line.trim().startsWith("HTTP_PORT="));

		if (!httpPortLine) {
			return "";
		}

		const [, rawValue = ""] = httpPortLine.split("=");
		return rawValue.trim().replace(/^['"]|['"]$/g, "");
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.error(
				`Failed to read local .env for HTTP_PORT: ${error.message}`,
			);
		}

		return "";
	}
}

function resolveHttpPort() {
	const httpPort =
		process.env.HTTP_PORT ||
		process.env.SERVER_PORT ||
		readEnvHttpPort() ||
		defaultHttpPort;

	if (!/^\d+$/.test(httpPort)) {
		throw new Error("HTTP_PORT must be a numeric TCP port.");
	}

	const portNumber = Number(httpPort);

	if (portNumber < 1 || portNumber > 65535) {
		throw new Error("HTTP_PORT must be between 1 and 65535.");
	}

	return httpPort;
}

function runCommand(command, args) {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch (error) {
		return "";
	}
}

function parsePidList(output) {
	return output
		.split(/[\s\r\n]+/)
		.map(pid => pid.trim())
		.filter(pid => /^\d+$/.test(pid) && pid !== String(process.pid));
}

function isPidInAppRoot(pid) {
	try {
		const pidCwd = fs.realpathSync(`/proc/${pid}/cwd`);
		return pidCwd === appRoot || pidCwd.startsWith(`${appRoot}${path.sep}`);
	} catch (error) {
		return false;
	}
}

function getPidsFromCommandLine(httpPort) {
	const output = runCommand("ps", ["-eo", "pid,args"]);
	const lines = output.split(/\r?\n/);

	return lines
		.filter(
			line =>
				line.includes("dist/index.js") ||
				line.includes("npm run start"),
		)
		.map(line => line.trim().split(/\s+/)[0])
		.filter(
			pid =>
				/^\d+$/.test(pid) &&
				pid !== String(process.pid) &&
				isPidInAppRoot(pid),
		);
}

function parseSsPids(output, httpPort) {
	return output
		.split(/\r?\n/)
		.filter(
			line =>
				line.includes(`:${httpPort}`) || line.includes(`.${httpPort}`),
		)
		.flatMap(line =>
			[...line.matchAll(/pid=(\d+)/g)].map(match => match[1]),
		);
}

function parseNetstatPids(output, httpPort) {
	return output
		.split(/\r?\n/)
		.filter(
			line =>
				line.includes(`:${httpPort} `) ||
				line.includes(`.${httpPort} `),
		)
		.map(line => line.trim().split(/\s+/).pop()?.split("/")[0] || "");
}

function getListeningPids(httpPort) {
	const pids = [
		...parsePidList(
			runCommand("lsof", ["-ti", `tcp:${httpPort}`, "-sTCP:LISTEN"]),
		),
		...parsePidList(runCommand("fuser", [`${httpPort}/tcp`])),
		...parsePidList(
			parseSsPids(runCommand("ss", ["-ltnp"]), httpPort).join("\n"),
		),
		...parsePidList(
			parseNetstatPids(runCommand("netstat", ["-tlnp"]), httpPort).join(
				"\n",
			),
		),
		...getPidsFromCommandLine(httpPort),
	];

	return [...new Set(pids)];
}

function wait(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function stopPids(pids) {
	// High-risk operation: stop only the process(es) matched to the resolved HTTP_PORT/backend command.
	for (const pid of pids) {
		process.kill(Number(pid), stopSignal);
	}
}

async function main() {
	const httpPort = resolveHttpPort();
	const pids = getListeningPids(httpPort);

	if (pids.length === 0) {
		// No listener means the stop target is already down, so this is a successful stop state.
		console.log(
			`No local process is listening on port ${httpPort}. Stop worked.`,
		);
		return;
	}

	if (isDryRun) {
		console.log(
			`Dry run: would stop local process(es) on port ${httpPort}: ${pids.join(", ")}`,
		);
		return;
	}

	stopPids(pids);

	for (let attempt = 1; attempt <= 30; attempt++) {
		await wait(1000);

		const remainingPids = getListeningPids(httpPort);

		if (remainingPids.length === 0) {
			console.log(
				`Stopped local process(es) on port ${httpPort}: ${pids.join(", ")}`,
			);
			return;
		}

		if (attempt >= 15 && attempt % 3 === 0) {
			console.log(
				`Port ${httpPort} is still open after ${stopSignal}; sending SIGKILL to remaining process(es): ${remainingPids.join(", ")}`,
			);
			for (const pid of remainingPids) {
				process.kill(Number(pid), "SIGKILL");
			}
		}
	}

	console.error(`Port ${httpPort} is still open after stop attempts.`);
	process.exitCode = 1;
}

main().catch(error => {
	console.error(error.message);
	process.exitCode = 1;
});
