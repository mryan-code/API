const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function isEmptyEnvValue(value) {
	return !value || !String(value).trim();
}

function findEnvPath() {
	if (process.env.DOTENV_PATH && fs.existsSync(process.env.DOTENV_PATH)) {
		return process.env.DOTENV_PATH;
	}

	const searchRoots = [
		path.resolve(__dirname, "..", ".."),
		process.cwd(),
	];

	for (const searchRoot of searchRoots) {
		let dir = searchRoot;
		for (let depth = 0; depth < 6; depth += 1) {
			const envFile = path.join(dir, ".env");
			const packageFile = path.join(dir, "package.json");
			// Require package.json so a parent/home `.env` cannot shadow the project file.
			if (fs.existsSync(envFile) && fs.existsSync(packageFile)) {
				return envFile;
			}
			const parent = path.dirname(dir);
			if (parent === dir) {
				break;
			}
			dir = parent;
		}
	}

	return null;
}

function parseProjectEnv() {
	const envPath = findEnvPath();
	if (!envPath) {
		return { envPath: path.join(process.cwd(), ".env"), parsed: null };
	}
	return {
		envPath,
		parsed: dotenv.parse(fs.readFileSync(envPath, "utf8")),
	};
}

/**
 * Load the project-root `.env` into process.env.
 * Empty existing values are filled from the file so login-shell blanks cannot hide PM2_APP or DB_*.
 * Does not print secret values.
 */
function loadProjectEnv() {
	const { envPath, parsed } = parseProjectEnv();
	if (!parsed) {
		console.error("Project .env was not found next to package.json.");
		return { envPath, loaded: false };
	}

	for (const key of Object.keys(parsed)) {
		if (isEmptyEnvValue(process.env[key])) {
			process.env[key] = parsed[key];
		}
	}

	return { envPath, loaded: true };
}

/**
 * Print `export KEY="value"` lines for missing or empty keys.
 * Used by deploy SSH shells so child npm/pm2/node processes inherit the project env.
 * HIGH-RISK: stdout is eval'd by bash; callers must not echo the result.
 */
function printBashExports() {
	const { parsed } = parseProjectEnv();
	if (!parsed) {
		console.error("Project .env was not found next to package.json.");
		return;
	}

	console.error(
		"Exporting " + String(Object.keys(parsed).length) + " keys from project .env.",
	);
	for (const key of Object.keys(parsed)) {
		if (isEmptyEnvValue(process.env[key])) {
			process.stdout.write(
				"export " + key + "=" + JSON.stringify(parsed[key]) + "\n",
			);
		}
	}
}

if (require.main === module) {
	printBashExports();
}

module.exports = {
	loadProjectEnv,
	printBashExports,
};
