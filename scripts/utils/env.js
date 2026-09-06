const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", "..", ".env");

/**
 * Update or append an environment variable in the .env file using single quotes.
 * Keeps NGROK_URL in sync with the latest tunnel so callbacks stay correct between runs.
 */
function updateEnvValue(key, value) {
	const formattedLine = `${key}='${value}'`;

	let envContent = "";

	try {
		envContent = fs.readFileSync(envPath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.error(`Failed to read ${envPath}: ${error.message}`);
			return null;
		}
		// If no .env exists yet, start with an empty string so we create one below.
		envContent = "";
	}

	const lines = envContent.split(/\r?\n/);
	let didUpdate = false;

	const updatedLines = lines.map(line => {
		if (line.trim().startsWith(`${key}=`)) {
			didUpdate = true;
			return formattedLine;
		}
		return line;
	});

	if (!didUpdate) {
		// Ensure there is a trailing newline before appending when needed.
		const lastLine = updatedLines[updatedLines.length - 1] || "";
		if (lastLine.trim() !== "" && envContent !== "") {
			updatedLines.push("");
		}
		updatedLines.push(formattedLine);
	}

	try {
		fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
		return envPath;
	} catch (error) {
		console.error(`Failed to write ${envPath}: ${error.message}`);
		return null;
	}
}

module.exports = {
	updateEnvValue,
};

