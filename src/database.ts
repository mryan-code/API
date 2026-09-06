import * as models from "./models";
import { Sequelize } from "sequelize";
import * as data from "./data";
import * as types from "./types";
import * as functions from "./functions";
import { loadEnv } from "./functions/loadEnv";
import { timeout } from "cron";

// Ensure `.env` is loaded even when running from `dist/` (PM2), before reading DB_* variables.
loadEnv();
const moduleTitle: string = "Database";

const startDB = async function (): Promise<types.KeyValue> {
	const returnValue: types.KeyValue = { value: {} };
	try {
		// Read env at runtime (not module-import time) to avoid missing values when dotenv is loaded later.
		const dbUser: string | undefined = process.env.DB_USER;
		const dbPassword: string | undefined = process.env.DB_PASS;
		const dbHost: string | undefined = process.env.DB_HOST;
		const dbPort: string | undefined = process.env.DB_PORT;
		const dbName: string | undefined = process.env.DB_NAME;

		if (dbUser && dbPassword && dbHost && dbPort && dbName) {
			const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
				host: dbHost,
				port: parseInt(dbPort),
				// Use PostgreSQL instead of MySQL so Sequelize emits Postgres-compatible SQL.
				dialect: "postgres",
				timezone: "+00:00",
				dialectOptions: {
					// High-risk DB operation: pg driver connection timeout; review before changing in shared environments.
					connectionTimeoutMillis: 60000,
				},
				logQueryParameters: true,
				logging: (sql: string) => {
					// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
					// 	console.log("sequelize logging: " + sql);
					// }
				},
				query: {
					nest: true,
				},
				define: {
					freezeTableName: true, // Prevents Sequelize from pluralizing table names
				},
			});
			(globalThis as unknown as types.KeyValue).sequelize = sequelize;
			returnValue.value = { colour: data.successColour, status: true };
		} else {
			const missingKeys: string[] = [];
			if (!dbUser) {
				missingKeys.push("DB_USER");
			}
			if (!dbPassword) {
				missingKeys.push("DB_PASS");
			}
			if (!dbHost) {
				missingKeys.push("DB_HOST");
			}
			if (!dbPort) {
				missingKeys.push("DB_PORT");
			}
			if (!dbName) {
				missingKeys.push("DB_NAME");
			}

			// Do not leak env values—only report missing key names for faster ops debugging.
			throw new Error(
				"Missing database credentials: " + missingKeys.join(", "),
			);
		}
	} catch (error) {
		returnValue.value = {
			colour: data.errorColour,
			status: false,
			error: error,
		};
	} finally {
		return returnValue.value;
	}
};

const initModels = async function (): Promise<types.KeyValue> {
	const returnValue: types.KeyValue = { value: {} };
	try {
		models.initRole((globalThis as unknown as types.KeyValue).sequelize);
		models.initUser((globalThis as unknown as types.KeyValue).sequelize);
		models.initLogin((globalThis as unknown as types.KeyValue).sequelize);
		models.Login.hasMany(models.User, {
			foreignKey: "id",
			sourceKey: "user_id",
		});
		models.User.hasMany(models.Login, {
			foreignKey: "user_id",
			sourceKey: "id",
		});

		models.initUserRole(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.belongsToMany(models.Role, {
			through: models.UserRole,
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.Role.belongsToMany(models.User, {
			through: models.UserRole,
			foreignKey: "role_id",
			sourceKey: "id",
		});
		// Bug fix: add direct UserRole associations so includes can target UserRole without eager-load errors.
		models.User.hasMany(models.UserRole, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.Role.hasMany(models.UserRole, {
			foreignKey: "role_id",
			sourceKey: "id",
		});
		models.UserRole.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});
		models.UserRole.belongsTo(models.Role, {
			foreignKey: "role_id",
			targetKey: "id",
		});
		// models.User.hasMany(models.UserRole, { foreignKey: "user_id", sourceKey: "id" });
		// models.Role.hasMany(models.UserRole, { foreignKey: "role_id", sourceKey: "id" });
		// models.UserRole.hasOne(models.User, { foreignKey: "id", sourceKey: "user_id" });
		// models.UserRole.hasOne(models.Role, { foreignKey: "id", sourceKey: "role_id" });

		models.initPage((globalThis as unknown as types.KeyValue).sequelize);
		models.initSection((globalThis as unknown as types.KeyValue).sequelize);
		models.Page.hasMany(models.Section, {
			foreignKey: "page_id",
			sourceKey: "id",
		});
		models.Section.hasMany(models.Page, {
			foreignKey: "section_id",
			sourceKey: "id",
		});
		models.initErrorLog(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		// High-risk DB operation: initialize downloaded LLM model metadata and link each record to the user who downloaded it.
		models.initCustomModel(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.hasMany(models.CustomModel, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.CustomModel.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		// Initialize RequestLog before request middleware writes logs, otherwise Sequelize metadata is undefined.
		models.initRequestLog(
			(globalThis as unknown as types.KeyValue).sequelize,
		);

		// Initialize global LLM rules so LLMAction global-rule CRUD endpoints can use generic persistence.
		models.initGlobalRule(
			(globalThis as unknown as types.KeyValue).sequelize,
		);

		// Initialize model types so LLMAction model-type CRUD endpoints have a persisted source of truth.
		models.initModelType(
			(globalThis as unknown as types.KeyValue).sequelize,
		);

		// Initialize prompt persistence so each saved prompt can be linked back to its owner.
		models.initPrompt((globalThis as unknown as types.KeyValue).sequelize);
		models.User.hasMany(models.Prompt, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.Prompt.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		// Initialize user memory tables so LLM memory CRUD endpoints can persist user state and thread history.
		models.initUserP2((globalThis as unknown as types.KeyValue).sequelize);
		models.User.hasMany(models.UserP2, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.UserP2.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		models.initUserConversationSubject(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.hasMany(models.UserConversationSubject, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.UserConversationSubject.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		models.initUserConversationContent(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.hasMany(models.UserConversationContent, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.UserConversationContent.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});
		// Fix association direction: a subject owns many conversation messages via user_conversation_subject_id.
		models.UserConversationSubject.hasMany(models.UserConversationContent, {
			foreignKey: "user_conversation_subject_id",
			sourceKey: "id",
		});
		models.UserConversationContent.belongsTo(
			models.UserConversationSubject,
			{
				foreignKey: "user_conversation_subject_id",
				targetKey: "id",
			},
		);

		models.initUserGuideline(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.hasMany(models.UserGuideline, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.UserGuideline.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		// Initialize user avatars so LLM avatar CRUD endpoints can persist avatar payloads by user.
		models.initUserAvatar(
			(globalThis as unknown as types.KeyValue).sequelize,
		);
		models.User.hasMany(models.UserAvatar, {
			foreignKey: "user_id",
			sourceKey: "id",
		});
		models.UserAvatar.belongsTo(models.User, {
			foreignKey: "user_id",
			targetKey: "id",
		});

		// Initialize avatar voice options so clients can load selectable voice values for avatars.
		models.initAvatarVoice(
			(globalThis as unknown as types.KeyValue).sequelize,
		);

		returnValue.value = { colour: data.successColour, status: true };
	} catch (error: any) {
		const errorResult: types.KeyValue | null = await functions.createError(
			null as unknown as types.HelperContext,
			error,
		);
		// if ((globalThis.globalVars.GLOBAL_DEBUG == "true" && globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info") || globalThis.globalVars.DEBUG_USER == "foobar") {
		// 	console.log("initModels errorResult: ", errorResult);
		// }
		returnValue.value = {
			colour: data.errorColour,
			status: false,
			error: errorResult as types.KeyValue,
		};
	} finally {
		return returnValue.value;
	}
};

async function database(): Promise<types.KeyValue> {
	const returnValue: types.KeyValue = { value: {} };
	returnValue.value = await startDB();
	if (returnValue.value.status) {
		returnValue.value = await initModels();
	}
	return { [moduleTitle]: returnValue.value };
}

export default database;
