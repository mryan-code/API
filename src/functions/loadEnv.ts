import dotenv from "dotenv";
import path from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";

let envLoaded: boolean = false;

function isEmptyEnvValue( value: string | undefined ): boolean {
	return !value || !value.trim();
}

function envLikeNames( dir: string ): string[] {
	try {
		return readdirSync(dir).filter( ( name ) => {
			return name === ".env" || name === "env" || name.startsWith(".env.");
		} );
	} catch {
		return [];
	}
}

function findEnvPath( explicitPath: string | undefined ): string | null {
	const candidates: string[] = [];
	if ( explicitPath ) {
		candidates.push(explicitPath);
	}
	// dist/functions -> project root, then dist/, then cwd.
	candidates.push(path.resolve(__dirname, "../..", ".env"));
	candidates.push(path.resolve(__dirname, "..", ".env"));
	candidates.push(path.resolve(process.cwd(), ".env"));

	const seen: Set<string> = new Set();
	for ( const candidatePath of candidates ) {
		if ( seen.has(candidatePath) ) {
			continue;
		}
		seen.add(candidatePath);
		if ( existsSync(candidatePath) ) {
			return candidatePath;
		}
	}

	const searchRoots: string[] = [
		path.resolve(__dirname, "../.."),
		process.cwd(),
	];
	for ( const searchRoot of searchRoots ) {
		let dir: string = searchRoot;
		for ( let depth = 0; depth < 6; depth += 1 ) {
			const envFile: string = path.join(dir, ".env");
			if ( existsSync(envFile) ) {
				return envFile;
			}
			const parent: string = path.dirname(dir);
			if ( parent === dir ) {
				break;
			}
			dir = parent;
		}
	}

	return null;
}

/**
 * Loads environment variables from a `.env` file when present.
 *
 * Why this exists:
 * - Deploy starts Node via nohup/PM2, often with a login-shell cwd that is not the project root.
 * - rsync --delete can remove host `.env` unless that file is excluded from the transfer.
 * - dotenv does not overwrite existing keys, so empty login-shell exports block `.env` values.
 *
 * Security note:
 * - This only reads file existence and loads dotenv; it does not print any env values.
 *
 * HIGH-RISK (filesystem read): requires human review in non-local environments.
 */
export function loadEnv(): void {
	if ( envLoaded ) {
		return;
	}
	envLoaded = true;

	const envPath: string | null = findEnvPath(process.env.DOTENV_PATH);
	if ( !envPath ) {
		const projectRoot: string = path.resolve(__dirname, "../..");
		console.error(
			"loadEnv: no .env file found. cwd=" +
				process.cwd() +
				" projectRoot=" +
				projectRoot +
				" dotenvPathSet=" +
				Boolean(process.env.DOTENV_PATH) +
				" cwdEnvLike=" +
				envLikeNames(process.cwd()).join(",") +
				" projectEnvLike=" +
				envLikeNames(projectRoot).join(","),
		);
		return;
	}

	applyEnvFile(envPath);
}

// Fill missing or empty keys from the chosen file so empty login-shell exports cannot hide credentials.
function applyEnvFile( envPath: string ): void {
	const parsed: dotenv.DotenvParseOutput = dotenv.parse(
		readFileSync(envPath, "utf8"),
	);
	for ( const key of Object.keys(parsed) ) {
		if ( isEmptyEnvValue(process.env[key]) ) {
			process.env[key] = parsed[key];
		}
	}
}
