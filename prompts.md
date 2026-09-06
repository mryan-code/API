# 2026-06-29 ~ fix deploy stop ssh continuation ~ mryan

- GitHub Actions deploy failed in the stop step with `ssh` usage output before connecting to HOST.
- Root cause: `.github/workflows/api-deploy.yml` had a blank line after a trailing shell continuation in the stop step SSH command, so the destination and SSH options were not included in the executed command.
- Removed the stray blank line so the SSH command remains a single continued command.

# 2026-06-30 ~ add pm2 npm scripts using PM2_APP env ~ mryan

- Added npm scripts `start:pm2` and `stop:pm2` in `package.json`.
- Added `scripts/start-pm2.js` and `scripts/stop-pm2.js`, both reading `PM2_APP` from environment (including `.env`) for PM2 process control.
- Updated `.github/workflows/api-deploy.yml` to use the new PM2 npm scripts and resolve PM2 app name from `PM2_APP` instead of a hardcoded name.

# 2026-06-30 ~ fix deploy server stopping by using pm2 keepalive ~ mryan

- Updated .github/workflows/api-deploy.yml so deploy stop/start handles a PM2-managed app name derived from SERVER_PORT.
- Start step now prefers PM2 (auto-restart keepalive) and falls back to nohup only when PM2 is unavailable.
- Readiness checks now understand both PM2 and nohup modes and print PM2 logs on startup failure.

# 2026-06-28 ~ add node server keepalive on start ~ mryan

- Added explicit HTTP server keep-alive and headers timeouts in `src/index.ts`, which is the server entrypoint launched by `npm run start`.
- Kept the `package.json` start command unchanged because the keep-alive behavior belongs to the Node server instance, not the npm wrapper.

# 2026-06-28 ~ add deploy ssh keepalives ~ mryan

- Added shared SSH keepalive options to `.github/workflows/deploy.yml`.
- Applied the keepalive options to active SSH deploy calls, rsync SSH transport, and reusable SSH control connection checks to reduce idle connection resets.

# 2026-06-28 ~ fix websocket url.parse deprecation warning ~ mryan

- Replaced deprecated `url.parse()` query parsing in `src/websockets.ts` with the WHATWG `URL` API.
- Preserved websocket query handling for `user_id` and `user_timezone` while avoiding the Node deprecation warning.
- Updated the existing Swagger mount regression test after the full Jest suite revealed a stale one-line source assertion.

# 2026-06-27 ~ use npm stop helper in deploy workflow ~ mryan

- Updated `.github/workflows/deploy.yml` to copy the checked-out `scripts/stop.js` helper to the remote deploy path and run it during the stop step.
- Updated `scripts/stop.js` so deploy can pass `SERVER_PORT`, and so remote hosts without `lsof` can still stop the listener using `fuser`, `ss`, `netstat`, or backend command fallback matching.
- Updated the remote stop SSH command to use `bash -l -s` so the HOST user's Node path is loaded before running the stop helper.

# 2026-06-27 ~ create npm stop script ~ mryan

- Added `npm run stop` to stop the local backend process by the configured `HTTP_PORT`.
- Added `scripts/stop.js` with a `--dry-run` option so the command can be verified without stopping a running server.
- The script reads `HTTP_PORT` from the environment, then `.env`, then defaults to `9876`.

# 2026-06-23 ~ ignore markdown warnings in ai_plans and prompts.md ~ mryan

- Added `.markdownlintignore` to suppress markdown lint warnings for generated planning docs in `ai_plans/*`.
- Added `prompts.md` to `.markdownlintignore` to prevent warnings on long historical prompt logs.

# 2026-06-23 ~ fix deploy stop/start server_port source and default path ~ mryan

- GitHub Actions deploy stop step failed after 30 seconds because it targeted a mismatched app context and port source.
- Root cause: workflow fallback `DEPLOY_PATH` pointed to `~/Documents/Personal/storm_zero/ui`, and stop/start scripts always preferred `.env` `HTTP_PORT` even when `SERVER_PORT` was explicitly provided.
- Updated `.github/workflows/deploy.yml` default `DEPLOY_PATH` back to `~/Documents/Personal/storm_zero/api`.
- Updated stop/start scripts to only read `.env` `HTTP_PORT` when `SERVER_PORT` is not set.
- Added explicit `SERVER_PORT` guards so deploy fails fast with a clear error instead of matching an empty port pattern.

# 2026-06-22 ~ fix deploy stop step process-tree cleanup ~ mryan

- GitHub Actions deploy stop step could leave the actual Node server running after killing only the wrapper PID, which kept the port open until timeout.
- Updated `.github/workflows/deploy.yml` to collect child processes for the matched server PIDs and kill the full process tree before waiting on the port to close.

# 2026-06-22 ~ add llmAction routes to swagger ~ mryan

- Added Swagger path definitions for the three LLMAction endpoints: `/health`, `/train`, and `/chat`.
- Documented response contracts using existing shared response components.
- Verified changes with `npm run build`.

# 2026-06-22 ~ fix repeated dotenv injection logs during startup ~ mryan

- Startup/build logs showed repeated dotenv injection messages from multiple module-level `dotenv.config()` calls.
- Replaced direct dotenv initialization across actions, middleware, functions, and websocket/app modules with shared `loadEnv()`.
- Updated `loadEnv()` to call dotenv with `quiet: true` so the noisy tips/injection logs are suppressed.
- Verified with `npm run build` and `npm test`.

# 2026-06-20 ~ fix startup crash when CORS_ORIGIN is missing ~ mryan

- GitHub Actions deploy reached start step but Node process exited before binding the port.
- Root cause: `process.env.CORS_ORIGIN` was undefined and `.split(",")` in `src/app.ts` threw at startup.
- Added `getCorsOrigins` helper with safe parsing and optional ngrok append.
- Updated `src/app.ts` to use the helper and preserved deprecated inline parsing as comments.
- Added Jest coverage for the helper and created missing Jest setup file path referenced by config.

# 2026-06-20 ~ fix deploy rsync info flag compatibility ~ mryan

- GitHub Actions deploy failed with `rsync: unrecognized option --info=STATS2`.
- Updated `.github/workflows/deploy.yml` rsync flags from `--info=stats2,progress2` to `--progress` and `--stats` for compatibility with older remote rsync versions.

# 2026-06-20 ~ fix deploy readonly path ~ mryan

- GitHub Actions deploy failed during rsync with `mkdir: /Documents: Read-only file system`.
- Added `DEPLOY_PATH` workflow env with fallback `~/Documents/Personal/storm_zero/api`.
- Replaced hardcoded `/Documents/Personal/storm_zero/api` with `DEPLOY_PATH` for rsync, stop, install, build, and start steps.
- Passed `DEPLOY_PATH` through remote SSH scripts and resolved `~` against remote `$HOME` before `cd`.

# 2026-06-20 ~ fix deploy SSH reachability ~ mryan

- GitHub Actions deploy failed with SSH timeout.
- Updated `.github/workflows/deploy.yml` to use `DEPLOY_PORT` secret with fallback `22`.
- Added SSH TCP preflight step for clearer failure cause.
- Added configurable runner via `vars.DEPLOY_RUNNER` (supports `self-hosted` for private network targets).

# 2026-02-06 ~ make query table ~ mryan

- there should be a tblquery table, that will be used to track the queries made to the LLM
    - id (int, auto-increment)
    - query (text, required)
    - response (text, required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the tblquery table
- update the migrations.sql file for the changes
- create the model schema for the tblquery table
- update the database.ts file for the changes
- update the models.ts file for the changes
- update the index.ts file for the changes
- this table has no routes, so no need to update the routes.ts file or swagger.json file

# 2026-06-20 ~ fix RequestLog uninitialized crash in logRequest ~ mryan

- Runtime request logging crashed with Sequelize TypeError reading `primaryKeyAttributes.length` from `RequestLog`.
- Root cause: `initRequestLog` was never called in `src/database.ts` model bootstrap.
- Added `models.initRequestLog(global.sequelize);` in `initModels`.
- Added regression tests in `src/__tests__/models/RequestLog.test.ts` covering pre-init failure and post-init success.

# 2026-06-21 ~ fix Express 5 CORS preflight wildcard crash ~ mryan

- App startup crashed after adding `app.options("*", cors())` with `PathError: Missing parameter name at index 1: *`.
- Root cause: Express 5/path-to-regexp requires named wildcard syntax.
- Replaced preflight route with `app.options("/{*cors_preflight}", cors(corsOptions));` and preserved deprecated line as comment.

# 2026-06-21 ~ fix deploy startup readiness log detection ~ mryan

- GitHub Actions deploy start step timed out at 300s even though the app started and logged `Web server running...`.
- Root cause: readiness log check only matched `App running at`, which no longer reflects current startup output.
- Updated `.github/workflows/deploy.yml` `has_started_log` to match either `App running at` or `Web server running.`.

# 2026-06-21 ~ fix swagger ui shadowing api routes ~ mryan

- `/get-page` was returning Swagger UI HTML because the docs middleware was mounted at `/` before the API routes.
- Moved Swagger UI to `/api-docs` so it no longer shadows route handlers like `/get-page`.
- Added a regression test and bootstrapped `globalThis.globalVars` for test imports.

# 2026-06-21 ~ fix LLMAction axios build errors ~ mryan

- `npm run build` failed in `src/actions/LLMAction.ts` because the class treated an Axios instance like a callable function and referenced missing fields like `this.appStore` and `resolvedApiTimeoutMs`.
- Switched the helper to `axiosClient.request(...)`, added a concrete API timeout value, and replaced the nonexistent app-store lookups with `globalThis.globalVars`.

# 2026-06-22 ~ fix globalThis.globalVars implicit any typing ~ mryan

- TypeScript reported `Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature` when reading `globalThis.globalVars`.
- Added `src/types/global.d.ts` to declare `globalThis.globalVars` with the existing `KeyValue` type so shared env-backed globals are typed consistently across the backend.

# 2026-06-29 ~ fix deploy workflow secrets condition ~ mryan

- GitHub Actions rejected `.github/workflows/deploy.yml` because step `if` expressions cannot reference the `secrets` context directly.
- Promoted `API_PORT` to the deploy job environment and changed the restart guard to use `env.API_PORT`.

# 2026-06-30 ~ create a table for the downloaded models
- there should be a tblmodel table, that will be used to track the models downloaded from the LLM
    - id (int, auto-increment)
    - model_label (text, required)
    - model_name (text, required)
    - model_type (text, required)
    - user_id (int, required, references tbluser.id)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the tblmodel table
- update the migrations.sql file for the changes
- create the model schema for the tblmodel table
- update the database.ts file for the changes

# 2026-06-30 ~ create a table for the downloaded models
- there should be a tblhard_rules table, that will be used to track the hard rules for the LLM
    - id (int, auto-increment)
    - rule (text, required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- there should be a tblguide_rules table, that will be used to track the guide rules for the LLM
    - id (int, auto-increment)
    - guide (text, required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- create the model schema for the new tables
- update the database.ts file for the changes
- update the models.ts file for the changes
- update the index.ts file for the changes

- create new functions for the new tables in LLMAction.ts (save, add, get, delete)
- create routes for the new tables in routes.ts
- create swagger documentation for the new tables in swagger.json
- create tests for the new tables in __tests__/models/ LLMAction.test.ts
- show me create statements for the new tables

# 2026-06-30 ~ update the rule tables
- add a label column to the tblhard_rules table
- add a label column to the tblguide_rules table
- update the migrations.sql file for the changes
- update the database.ts file for the changes
- update the models.ts file for the changes
- update the index.ts file for the changes

- create new functions for the new columns in LLMAction.ts (save, add, get, delete)
- create routes for the new columns in routes.ts
- create swagger documentation for the new columns in swagger.json
- create tests for the new columns in __tests__/models/ LLMAction.test.ts
- show me create statements for the new columns

# 2026-06-30 ~ create a table for the global rules
- there should be a tblglobal_rule table
    - id (int, auto-increment)
    - rule (text, required)
    - strict (int(1), required, default 1)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the new table
- update the migrations.sql file for the changes
- create the model schema for the new table
- update the database.ts file for the changes

- create actions for the new table in LLMAction.ts (get, add, save, delete)
-create routes for the new functions

# 2026-07-06 ~ create a table for the system model types
- there should be a tblmodel_type table
    - id (int, auto-increment)
    - type (varchar(10), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the new table
- update the migrations.sql file for the changes
- create the model schema for the new table
- update the database.ts file for the changes

- create actions for the new table in LLMAction.ts (get, add, save, delete)
- create routes for the new functions

# 2026-07-06 ~ create a table for the prompts
- there should be a tblprompt table
    - id (int, auto-increment)
    - prompt (text, required)
    - user_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the new table
- update the migrations.sql file for the changes
- create the model schema for the new table
- update the database.ts file for the changes

# 2026-07-09 ~ create new tables for user memories
- there should be a tbluser_p2 table
    - id (int, auto-increment)
    - memory (text, required)
    - user_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- there should be a tbluser_conversation table
    - id (int, auto-increment)
    - subject (varchar(100), required)
    - user_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- there should be a tblconversation table
    - id (int, auto-increment)
    - conversation (text, required)
    - user_id (int(11), required)
    - user_conversation_subject_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- there should be a tbluser_guideline table
    - id (int, auto-increment)
    - guideline (text, required)
    - user_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)

- show me to create statement for the new tables
- update the migrations.sql file for the changes
- create the model schema for the new tables
- update the database.ts file for the changes

- create actions for the new tables in LLMAction.ts (get, add, save, delete)
- create routes for the new functions

# 2026-07-15 ~ create a table for the uservavatar
- there should be a tbluser_avatar table
    - id (int, auto-increment)
    - data (text, required)
    - user_id (int(11), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the new table
- update the migrations.sql file for the changes
- create the model schema for the new table
- update the database.ts file for the changes

- create actions for the new table in LLMAction.ts (get, add, save, delete)
-create routes for the new functions

# 2026-07-15 ~ create new fields for tbluser_avatar
- avatar_name (varchar(75), not required, default="Avatar")
- persona_humourous_serious (int(2), not required, default="50")
- persona_emotional_sterile (int(2), not required, default="50")
- persona_informal_business (int(2), not required, default="50")
- persona_playful_strict (int(2), not required, default="50")
- persona_quirky_convensional (int(2), not required, default="50")
- avatar_voice (varchar(50), not required, default="af_heart")
- avatar_details (text, not required, default="")
- show me an update statement
- update the schema

# 2026-07-15 ~ create new table for voice options
- there should be a tbluser_avatar table
    - id (int, auto-increment)
    - label (varchar(50), required)
    - option (varchar(50), required)
    - gender (varchar(1), required)
    - created (datetime, required, default current_timestamp)
    - deleted (tinyint, required, default 0, comment: '0 == not deleted, 1 == deleted')
    - PRIMARY KEY (`id`)
- show me to create statement for the new table
- update the migrations.sql file for the changes
- create the model schema for the new table
- update the database.ts file for the changes

- the options are
    label, option, gender
    Heart, af_heart, f
	Alloy, af_alloy, f
	Aoede, af_aoede, f
	Bella, af_bella, f
	Jessica, af_jessica, f
	Kore, af_kore, f
	Nicole, af_nicole, f
	Nova, af_nova, f
	River, af_river, f
	Sarah, af_sarah, f
	Sky, af_sky, f
	Adam, am_adam, m
	Echo, am_echo, m
	Eric, am_eric, m
	Fenrir, am_fenrir, m
	Liam, am_liam, m
	Michael, am_michael, m
	Onxy, am_onyx, m
	Puck, am_puck, m
	Santa, am_santa, m
- show me an insert statement