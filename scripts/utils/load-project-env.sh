#!/usr/bin/env bash
# Load the project-root `.env` into the current deploy shell via dotenv, not bash source.
# `.env` lines like `GLOBAL_DEBUG = true` are valid dotenv and invalid bash.
# HIGH-RISK: injects credentials into the process environment; do not echo values.

find_project_env() {
	if [ -f "$(pwd)/.env" ]; then
		printf '%s\n' "$(pwd)/.env"
		return 0
	fi
	local dir
	dir="$(pwd)"
	while [ -n "$dir" ] && [ "$dir" != "/" ]; do
		if [ -f "$dir/.env" ]; then
			printf '%s\n' "$dir/.env"
			return 0
		fi
		dir="$(dirname "$dir")"
	done
	return 1
}

env_file=""
if env_file="$(find_project_env)"; then
	echo "Deploy found project .env next to package.json."
	export DOTENV_PATH="$env_file"
	if [ -f "scripts/utils/loadProjectEnv.js" ]; then
		eval "$(node scripts/utils/loadProjectEnv.js)"
	else
		echo "loadProjectEnv.js is missing; cannot load .env into the deploy shell." >&2
	fi
else
	echo "Deploy did not find a .env next to package.json in $(pwd)." >&2
fi
