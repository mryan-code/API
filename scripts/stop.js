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
		// Can't verify cwd (permissions or non-Linux); keep the PID as a stop candidate.
		return true;
	}
}

function getPidsFromCommandLine() {
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

// True when ss/netstat show a LISTEN socket on the target port (PID discovery optional).
function isPortListeningFromOutput(output, httpPort) {
	const portPattern = new RegExp(`[:.]${httpPort}(?:\\s|$)`);

	return output
		.split(/\r?\n/)
		.some(line => /LISTEN/i.test(line) && portPattern.test(line));
}

function isPortListening(httpPort) {
	const ssOutput = runCommand("ss", ["-ltn"]);
	if (ssOutput && isPortListeningFromOutput(ssOutput, httpPort)) {
		return true;
	}

	const netstatOutput = runCommand("netstat", ["-ltn"]);
	if (netstatOutput && isPortListeningFromOutput(netstatOutput, httpPort)) {
		return true;
	}

	return false;
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
		...getPidsFromCommandLine(),
	];

	return [...new Set(pids)];
}

function getChildPids(parentPids) {
	const parentSet = new Set(parentPids.map(String));
	const output = runCommand("ps", ["-eo", "pid=,ppid="]);

	return output
		.split(/\r?\n/)
		.map(line => line.trim().split(/\s+/))
		.filter(
			parts =>
				parts.length >= 2 &&
				/^\d+$/.test(parts[0]) &&
				parentSet.has(parts[1]),
		)
		.map(parts => parts[0]);
}

// Expand parents to the full process tree so npm wrappers and node children both stop.
function expandProcessTree(seedPids) {
	const allPids = new Set(seedPids.map(String));
	let frontier = [...allPids];

	while (frontier.length > 0) {
		const children = getChildPids(frontier).filter(pid => !allPids.has(pid));
		if (children.length === 0) {
			break;
		}

		for (const child of children) {
			allPids.add(child);
		}
		frontier = children;
	}

	return [...allPids];
}

function wait(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function signalPid(pid, signal) {
	try {
		// High-risk operation: signal a matched local process for deploy stop.
		process.kill(Number(pid), signal);
		return true;
	} catch (error) {
		if (error && error.code !== "ESRCH") {
			console.error(
				`Failed to signal PID ${pid} with ${signal}: ${error.message}`,
			);
		}
		return false;
	}
}

function stopPids(pids, signal) {
	const treePids = expandProcessTree(pids);

	for (const pid of treePids) {
		signalPid(pid, signal);
	}

	return treePids;
}

function forceKillByPort(httpPort) {
	// Last-resort port reclaim when PID signaling left the LISTEN socket open.
	if (runCommand("fuser", ["-k", "-9", `${httpPort}/tcp`])) {
		return;
	}

	runCommand("fuser", ["-k", `${httpPort}/tcp`]);
}

async function main() {
	const httpPort = resolveHttpPort();
	const pids = getListeningPids(httpPort);
	const portOpen = isPortListening(httpPort);

	if (pids.length === 0 && !portOpen) {
		// No listener means the stop target is already down, so this is a successful stop state.
		console.log(
			`No local process is listening on port ${httpPort}. Stop worked.`,
		);
		return;
	}

	if (pids.length === 0 && portOpen) {
		// Port is open but PID discovery failed; do not report success or deploy will race the listener.
		console.error(
			`Port ${httpPort} is open but no stoppable PID was found.`,
		);
		forceKillByPort(httpPort);
		await wait(1000);
		if (isPortListening(httpPort)) {
			process.exitCode = 1;
			return;
		}

		console.log(`Stopped listener on port ${httpPort} via port force-kill.`);
		return;
	}

	if (isDryRun) {
		console.log(
			`Dry run: would stop local process(es) on port ${httpPort}: ${pids.join(", ")}`,
		);
		return;
	}

	const signaledPids = stopPids(pids, stopSignal);

	for (let attempt = 1; attempt <= 30; attempt++) {
		await wait(1000);

		const remainingPids = getListeningPids(httpPort);
		const stillListening = isPortListening(httpPort);

		// Success only when the port is actually closed, not merely when PID discovery goes empty.
		if (!stillListening && remainingPids.length === 0) {
			console.log(
				`Stopped local process(es) on port ${httpPort}: ${signaledPids.join(", ")}`,
			);
			return;
		}

		if (attempt >= 15 && attempt % 3 === 0) {
			const killTargets =
				remainingPids.length > 0 ? remainingPids : signaledPids;
			console.log(
				`Port ${httpPort} is still open after ${stopSignal}; sending SIGKILL to remaining process(es): ${killTargets.join(", ")}`,
			);
			stopPids(killTargets, "SIGKILL");
			forceKillByPort(httpPort);
		}
	}

	console.error(`Port ${httpPort} is still open after stop attempts.`);
	process.exitCode = 1;
}

if (require.main === module) {
	main().catch(error => {
		console.error(error.message);
		process.exitCode = 1;
	});
}

module.exports = {
	isPortListeningFromOutput,
	parseSsPids,
	parseNetstatPids,
};
