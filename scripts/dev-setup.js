#!/usr/bin/env node

/**
 * Orchestrates the development setup process:
 * 1. Starts ngrok in the background
 * 2. Waits for ngrok to be ready
 * 3. Gets the ngrok URL
 * 4. Sets NGROK_URL environment variable
 * 5. Starts the dev server (foreground)
 * 6. Spawns update-callbacks in the background
 * 7. Handles cleanup on process termination
 */

// Load environment variables from .env file
require("dotenv").config();

const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const os = require("os");
const { updateEnvValue } = require("./utils/env");

const NGROK_API_URL = "http://localhost:4040/api/tunnels";
const NGROK_MAX_RETRIES = 30;
const NGROK_RETRY_DELAY = 1000; // 1 second
const BACKGROUND_PID_FILE = path.join(__dirname, "..", ".dev-background-pids.json");

// Store child processes for cleanup
let ngrokProcess = null;
let updateCallbacksProcess = null;
let updateDestinationProcess = null;
let devProcess = null;
let isCleaningUp = false;
const backgroundProcesses = new Map();

/**
 * Save background process PIDs so cleanup can stop every helper when the main server exits.
 */
function writeBackgroundPidFile() {
	const pidEntries = Array.from(backgroundProcesses.values()).map(processEntry => ({
		name: processEntry.name,
		pid: processEntry.pid,
	}));

	try {
		if (pidEntries.length === 0) {
			if (fs.existsSync(BACKGROUND_PID_FILE)) {
				fs.unlinkSync(BACKGROUND_PID_FILE);
			}
			return;
		}

		fs.writeFileSync(BACKGROUND_PID_FILE, JSON.stringify(pidEntries, null, 2));
	} catch (error) {
		console.error(`Unable to write background PID file: ${error.message}`);
	}
}

function registerBackgroundProcess(name, childProcess) {
	if (!childProcess || !childProcess.pid) {
		return;
	}

	backgroundProcesses.set(name, {
		name,
		pid: childProcess.pid,
		process: childProcess,
	});
	writeBackgroundPidFile();

	childProcess.on("exit", () => {
		if (!isCleaningUp) {
			backgroundProcesses.delete(name);
			writeBackgroundPidFile();
		}
	});
}

function clearBackgroundPidFile() {
	backgroundProcesses.clear();
	writeBackgroundPidFile();
}

function isProcessRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error.code === "EPERM";
	}
}

function killProcess(childProcess, pid, forceDelay = 500) {
	const processId = pid || childProcess?.pid;

	if (!processId) {
		return;
	}

	if (childProcess && childProcess.pid) {
		try {
			childProcess.kill("SIGTERM");
		} catch (error) {
			// Process might already be dead
		}

		setTimeout(() => {
			if (isProcessRunning(processId)) {
				try {
					process.kill(processId, "SIGKILL");
				} catch (error) {
					// Ignore errors
				}
			}
		}, forceDelay);
		return;
	}

	try {
		process.kill(processId, "SIGTERM");
	} catch (error) {
		// Process might already be dead
	}

	setTimeout(() => {
		if (isProcessRunning(processId)) {
			try {
				process.kill(processId, "SIGKILL");
			} catch (error) {
				// Ignore errors
			}
		}
	}, forceDelay);
}

function killBackgroundProcesses() {
	backgroundProcesses.forEach(processEntry => {
		killProcess(processEntry.process, processEntry.pid);
	});
	clearBackgroundPidFile();
}

/**
 * Wait for ngrok API to be available by polling
 */
function waitForNgrok(retries = 0) {
	return new Promise((resolve, reject) => {
		http.get(NGROK_API_URL, res => {
			let data = "";

			res.on("data", chunk => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const response = JSON.parse(data);
					const httpsTunnel = response.tunnels?.find(tunnel => tunnel.proto === "https");
					const httpTunnel = response.tunnels?.find(tunnel => tunnel.proto === "http");
					const tunnel = httpsTunnel || httpTunnel;

					if (tunnel && tunnel.public_url) {
						resolve(tunnel.public_url);
					} else {
						if (retries < NGROK_MAX_RETRIES) {
							setTimeout(() => {
								waitForNgrok(retries + 1)
									.then(resolve)
									.catch(reject);
							}, NGROK_RETRY_DELAY);
						} else {
							reject(new Error("No ngrok tunnel found after waiting"));
						}
					}
				} catch (error) {
					if (retries < NGROK_MAX_RETRIES) {
						setTimeout(() => {
							waitForNgrok(retries + 1)
								.then(resolve)
								.catch(reject);
						}, NGROK_RETRY_DELAY);
					} else {
						reject(new Error(`Failed to parse ngrok API response: ${error.message}`));
					}
				}
			});
		}).on("error", error => {
			if (retries < NGROK_MAX_RETRIES) {
				setTimeout(() => {
					waitForNgrok(retries + 1)
						.then(resolve)
						.catch(reject);
				}, NGROK_RETRY_DELAY);
			} else {
				reject(new Error(`Failed to connect to ngrok API: ${error.message}`));
			}
		});
	});
}

/**
 * Start ngrok in the background
 * Don't use stdio: "inherit" to avoid signal handling issues
 */
function startNgrok() {
	console.log("Starting ngrok...");
	ngrokProcess = spawn("ngrok", ["http", "https://localhost:9876"], {
		stdio: ["ignore", "ignore", "ignore"], // Don't inherit stdio to avoid signal issues
		detached: false,
	});
	registerBackgroundProcess("ngrok", ngrokProcess);

	ngrokProcess.on("error", error => {
		console.error("Error starting ngrok:", error.message);
		console.error("Make sure ngrok is installed and available in your PATH");
		process.exit(1);
	});

	ngrokProcess.on("exit", code => {
		if (code !== 0 && code !== null) {
			console.error(`ngrok exited with code ${code}`);
		}
	});
}

/**
 * Get ngrok URL from the API
 */
function getNgrokUrl() {
	return new Promise((resolve, reject) => {
		http.get(NGROK_API_URL, res => {
			let data = "";

			res.on("data", chunk => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const response = JSON.parse(data);
					const httpsTunnel = response.tunnels?.find(tunnel => tunnel.proto === "https");
					const httpTunnel = response.tunnels?.find(tunnel => tunnel.proto === "http");
					const tunnel = httpsTunnel || httpTunnel;

					if (!tunnel || !tunnel.public_url) {
						reject(new Error("No ngrok tunnel found"));
						return;
					}

					resolve(tunnel.public_url);
				} catch (error) {
					reject(new Error(`Failed to parse ngrok API response: ${error.message}`));
				}
			});
		}).on("error", error => {
			reject(new Error(`Failed to connect to ngrok API: ${error.message}`));
		});
	});
}

/**
 * Start the dev server with NGROK_URL environment variable
 */
function startDevServer(ngrokUrl) {
	console.log(`Starting dev server with NGROK_URL=${ngrokUrl}...`);

	const env = {
		...process.env,
		NGROK_URL: ngrokUrl,
	};

	// Use npm run dev which will handle the nodemon setup
	// Keep stdio: "inherit" for proper terminal interaction
	devProcess = spawn("npm", ["run", "dev"], {
		env,
		stdio: "inherit",
		shell: true,
	});

	devProcess.on("error", error => {
		console.error("Error starting dev server:", error.message);
		cleanup();
		process.exit(1);
	});

	devProcess.on("exit", code => {
		console.log(`Dev server exited with code ${code}`);
		// Only cleanup and exit if we're not already cleaning up (to avoid double cleanup)
		if (!isCleaningUp) {
			cleanup();
			process.exit(code || 0);
		}
	});

	return devProcess;
}

/**
 * Start update-callbacks in the background
 * Sets USER_ID environment variable (defaults to 7 per AGENTS.md)
 */
function startUpdateCallbacks() {
	console.log("Starting update-callbacks in the background...");

	// Set USER_ID if not already set (default to 7 per AGENTS.md)
	const env = {
		...process.env,
		USER_ID: process.env.USER_ID || "7",
	};

	const scriptPath = path.join(__dirname, "update-twilio-callbacks.js");
	updateCallbacksProcess = spawn("node", [scriptPath], {
		env,
		stdio: "inherit",
		detached: false,
	});
	registerBackgroundProcess("update-twilio-callbacks", updateCallbacksProcess);

	updateCallbacksProcess.on("error", error => {
		console.error("Error starting update-callbacks:", error.message);
		// Don't exit, just log the error
	});

	updateCallbacksProcess.on("exit", code => {
		if (code !== 0 && code !== null) {
			console.error(`update-callbacks exited with code ${code}`);
		}
	});
}

function startUpdateDestination() {
	console.log("Starting update-aws-destination-callback in the background...");

	// Keep the destination callback process on the parent environment instead of using the callback-local env variable.
	const env = {
		...process.env,
	};

	const scriptPath = path.join(__dirname, "update-aws-destination-callback.js");
	updateDestinationProcess = spawn("node", [scriptPath], {
		env,
		stdio: "inherit",
		detached: false,
	});
	registerBackgroundProcess("update-aws-destination-callback", updateDestinationProcess);

	updateDestinationProcess.on("error", error => {
		console.error("Error starting update-aws-destination-callback:", error.message);
		// Don't exit, just log the error
	});

	updateDestinationProcess.on("exit", code => {
		if (code !== 0 && code !== null) {
			console.error(`update-aws-destination-callback exited with code ${code}`);
		}
	});
}

/**
 * Cleanup function to kill child processes
 * Uses process groups on Unix to kill all child processes
 */
function cleanup() {
	if (isCleaningUp) {
		return;
	}
	isCleaningUp = true;

	console.log("\nCleaning up...");

	// On Unix systems, kill the entire process group
	if (os.platform() !== "win32") {
		try {
			// Kill the process group (negative PID kills the group)
			if (devProcess && devProcess.pid) {
				process.kill(-devProcess.pid, "SIGTERM");
			}
		} catch (error) {
			// Process group might not exist, continue with individual kills
		}
	}

	// Kill dev server first, then every saved background PID including destination callbacks.
	killProcess(devProcess, devProcess?.pid, 1000);
	killBackgroundProcesses();
}

// Handle process termination
// Set up signal handlers before spawning any processes
let signalReceived = false;

const handleExit = signal => {
	if (signalReceived) {
		// Second signal - force exit immediately
		process.exit(0);
		return;
	}

	signalReceived = true;

	if (isCleaningUp) {
		// If already cleaning up, force exit immediately
		process.exit(0);
		return;
	}

	console.log(`\nReceived ${signal}, shutting down...`);
	cleanup();

	// Force exit after cleanup, don't wait for child processes
	setTimeout(() => {
		process.exit(0);
	}, 500);
};

// Set up signal handlers early, before any async operations
// Use once: false to ensure handlers stay active
process.on("SIGINT", () => {
	handleExit("SIGINT");
});

process.on("SIGTERM", () => {
	handleExit("SIGTERM");
});

process.on("SIGHUP", () => {
	handleExit("SIGHUP");
});

// Prevent the process from exiting on uncaught exceptions during cleanup
process.on("uncaughtException", error => {
	if (!isCleaningUp) {
		console.error("Uncaught exception:", error);
		cleanup();
		process.exit(1);
	}
});

// Main execution
async function main() {
	try {
		// Step 1: Start ngrok
		startNgrok();

		// Step 2: Wait for ngrok to be ready
		console.log("Waiting for ngrok to be ready...");
		await waitForNgrok();

		// Step 3: Get ngrok URL
		console.log("Getting ngrok URL...");
		const ngrokUrl = await getNgrokUrl();
		console.log(`ngrok URL: ${ngrokUrl}`);

		// Persist NGROK_URL so callbacks remain correct across terminal sessions.
		const envPath = updateEnvValue("NGROK_URL", ngrokUrl);
		if (envPath) {
			console.log(`Updated NGROK_URL in ${envPath}`);
		} else {
			console.warn("Unable to update NGROK_URL in .env, continuing with in-memory value.");
		}

		// Step 4: Start dev server with NGROK_URL set
		startDevServer(ngrokUrl);

		// Step 5: Start update-callbacks in the background
		// Give the dev server a moment to start before spawning update-callbacks
		setTimeout(() => {
			startUpdateCallbacks();
			// startUpdateDestination();
		}, 2000);

		// The dev server will run in the foreground and block
		// When it exits, cleanup will be called via the exit handler
	} catch (error) {
		console.error("Error during setup:", error.message);
		cleanup();
		process.exit(1);
	}
}

main();
