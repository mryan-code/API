import { Request, Response } from "express";
import { Sequelize } from "sequelize";

jest.mock("@huggingface/hub", () => ({
	snapshotDownload: jest.fn(),
	listModels: jest.fn(),
}));

import { LLMAction } from "../../actions/LLMAction";
import {
	GlobalRule,
	initGlobalRule,
	ModelType,
	initModelType,
	initUserConversationContent,
	initUserConversationSubject,
	initUserGuideline,
	initUserP2,
	initUserAvatar,
	UserConversationContent,
	UserConversationSubject,
	UserGuideline,
	UserP2,
	UserAvatar,
} from "../../models";

describe("GlobalRule model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build throws before model init", () => {
		expect(() => {
			GlobalRule.build({
				rule: "Always avoid exposing secrets.",
				strict: 1,
			});
		}).toThrow(TypeError);
	});

	test("build succeeds after initGlobalRule", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		// Regression guard: global rules must map to tblglobal_rule before LLMAction uses generic CRUD.
		initGlobalRule(sequelize);

		const globalRule = GlobalRule.build({
			rule: "Always avoid exposing secrets.",
			summary: "Avoid exposing secrets.",
			strict: 1,
		});

		expect(globalRule).toBeInstanceOf(GlobalRule);
		expect(GlobalRule.tableName).toBe("tblglobal_rule");
		expect(GlobalRule.primaryKeyAttributes).toContain("id");
		expect(GlobalRule.getAttributes().rule.allowNull).toBe(false);
		expect(GlobalRule.getAttributes().summary.allowNull).toBe(true);
		expect(GlobalRule.getAttributes().strict.defaultValue).toBe(1);
		expect(GlobalRule.getAttributes().deleted.defaultValue).toBe(0);
	});
});

describe("LLMAction global rule routing", () => {
	type CrudMethod = "add" | "save" | "delete";

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const createAction = (path: string) => {
		return new LLMAction(
			{
				path,
				body: {},
				headers: {},
			} as Request,
			{} as Response,
			true,
		);
	};

	test.each([
		["/add-global-rule", "add", GlobalRule],
		["/save-global-rule", "save", GlobalRule],
		["/delete-global-rule", "delete", GlobalRule],
	] as [string, CrudMethod, typeof GlobalRule][])(
		"routes %s to generic %s with the correct model",
		async (path, method, model) => {
			const action = createAction(path);
			const crudSpy = jest
				.spyOn(action, method)
				.mockImplementation(async function (this: LLMAction) {
					// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
					this.success = true;
				});

			await action.task();

			expect(crudSpy).toHaveBeenCalledWith([model]);
			expect(action.success).toBe(true);
		},
	);

	test("routes /get-global-rule to custom getGlobalRule", async () => {
		const action = createAction("/get-global-rule");
		const getGlobalRuleSpy = jest
			.spyOn(action, "getGlobalRule")
			.mockImplementation(async function (this: LLMAction) {
				// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
				this.success = true;
			});

		await action.task();

		expect(getGlobalRuleSpy).toHaveBeenCalledTimes(1);
		expect(action.success).toBe(true);
	});
});

describe("ModelType model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build throws before model init", () => {
		expect(() => {
			ModelType.build({
				model: "system",
			});
		}).toThrow(TypeError);
	});

	test("build succeeds after initModelType", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		// Regression guard: model types must map to tblmodel_type before LLMAction uses generic CRUD.
		initModelType(sequelize);

		const modelType = ModelType.build({
			model: "system",
		});

		expect(modelType).toBeInstanceOf(ModelType);
		expect(ModelType.tableName).toBe("tblmodel_type");
		expect(ModelType.primaryKeyAttributes).toContain("id");
		expect(ModelType.getAttributes().model.allowNull).toBe(false);
		expect(ModelType.getAttributes().deleted.defaultValue).toBe(0);
	});
});

describe("LLMAction model type routing", () => {
	type CrudMethod = "add" | "save" | "delete";

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const createAction = (path: string, body: Record<string, unknown> = {}) => {
		return new LLMAction(
			{
				path,
				body,
				headers: {},
			} as Request,
			{} as Response,
			true,
		);
	};

	test.each([
		["/add-model-type", "add", ModelType],
		["/save-model-type", "save", ModelType],
		["/delete-model-type", "delete", ModelType],
	] as [string, CrudMethod, typeof ModelType][])(
		"routes %s to generic %s with the correct model",
		async (path, method, model) => {
			// deleteModelType only dispatches generic delete when an id is present.
			const action = createAction(path, { id: 1 });
			const crudSpy = jest
				.spyOn(action, method)
				.mockImplementation(async function (this: LLMAction) {
					// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
					this.success = true;
				});

			await action.task();

			expect(crudSpy).toHaveBeenCalledWith([model]);
			expect(action.success).toBe(true);
		},
	);

	test("routes /get-model-type to custom getModelType", async () => {
		const action = createAction("/get-model-type");
		const getModelTypeSpy = jest
			.spyOn(action, "getModelType")
			.mockImplementation(async function (this: LLMAction) {
				// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
				this.success = true;
			});

		await action.task();

		expect(getModelTypeSpy).toHaveBeenCalledTimes(1);
		expect(action.success).toBe(true);
	});
});

describe("User memory model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build succeeds after memory model initialization", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		// Regression guard: memory models must keep table mappings used by LLMAction CRUD dispatch.
		initUserP2(sequelize);
		initUserConversationSubject(sequelize);
		initUserConversationContent(sequelize);
		initUserGuideline(sequelize);
		initUserAvatar(sequelize);

		const userP2 = UserP2.build({
			key: "preference",
			value: "Remember to keep answers concise.",
			user_id: 1,
		});
		const userConversationSubject = UserConversationSubject.build({
			subject: "Billing",
			user_id: 1,
		});
		const userConversationContent = UserConversationContent.build({
			response: "How can I update my card?",
			user_id: 1,
			user_conversation_subject_id: 2,
		});
		const userGuideline = UserGuideline.build({
			guideline: "Always provide step-by-step answers.",
			user_id: 1,
		});
		const userAvatar = UserAvatar.build({
			user_id: 1,
		});

		expect(userP2).toBeInstanceOf(UserP2);
		expect(UserP2.tableName).toBe("tbluser_p2");
		expect(UserP2.getAttributes().key.allowNull).toBe(false);
		expect(UserP2.getAttributes().value.allowNull).toBe(false);

		expect(userConversationSubject).toBeInstanceOf(UserConversationSubject);
		expect(UserConversationSubject.tableName).toBe(
			"tbluser_conversation_subject",
		);
		expect(UserConversationSubject.getAttributes().subject.allowNull).toBe(
			false,
		);

		expect(userConversationContent).toBeInstanceOf(UserConversationContent);
		expect(UserConversationContent.tableName).toBe(
			"tbluser_conversation_content",
		);
		expect(UserConversationContent.getAttributes().response.allowNull).toBe(
			false,
		);
		expect(
			UserConversationContent.getAttributes().user_conversation_subject_id
				.allowNull,
		).toBe(false);

		expect(userGuideline).toBeInstanceOf(UserGuideline);
		expect(UserGuideline.tableName).toBe("tbluser_guideline");
		expect(UserGuideline.getAttributes().guideline.allowNull).toBe(false);

		expect(userAvatar).toBeInstanceOf(UserAvatar);
		expect(UserAvatar.tableName).toBe("tbluser_avatar");
		expect(UserAvatar.getAttributes().user_id.allowNull).toBe(false);
		expect(UserAvatar.getAttributes().avatar_name.defaultValue).toBe(
			"Avatar",
		);
		expect(
			UserAvatar.getAttributes().persona_humorous_serious.defaultValue,
		).toBe(50);
		expect(UserAvatar.getAttributes().avatar_voice.defaultValue).toBe(
			"af_heart",
		);
		expect(UserAvatar.getAttributes().avatar_details.defaultValue).toBe("");
	});
});

describe("LLMAction user memory routing", () => {
	type CrudMethod = "add" | "save" | "delete";

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const createAction = (path: string, body: Record<string, unknown> = {}) => {
		return new LLMAction(
			{
				path,
				body,
				headers: {},
			} as Request,
			{} as Response,
			true,
		);
	};

	test.each([
		["/add-user-p2", "add", UserP2],
		["/save-user-p2", "save", UserP2],
		["/delete-user-p2", "delete", UserP2],
		["/add-user-conversation-subject", "add", UserConversationSubject],
		["/save-user-conversation-subject", "save", UserConversationSubject],
		[
			"/delete-user-conversation-subject",
			"delete",
			UserConversationSubject,
		],
		["/add-user-conversation-content", "add", UserConversationContent],
		["/save-user-conversation-content", "save", UserConversationContent],
		[
			"/delete-user-conversation-content",
			"delete",
			UserConversationContent,
		],
		["/add-user-guideline", "add", UserGuideline],
		["/save-user-guideline", "save", UserGuideline],
		["/delete-user-guideline", "delete", UserGuideline],
		["/add-user-avatar", "add", UserAvatar],
		["/save-user-avatar", "save", UserAvatar],
		["/delete-user-avatar", "delete", UserAvatar],
	] as [string, CrudMethod, typeof UserP2][])(
		"routes %s to generic %s with the correct model",
		async (path, method, model) => {
			// save/delete memory routes only dispatch generic CRUD when an id is present.
			const action = createAction(
				path,
				method === "add" ? {} : { id: 1 },
			);
			const crudSpy = jest
				.spyOn(action, method)
				.mockImplementation(async function (this: LLMAction) {
					// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
					this.success = true;
				});

			await action.task();

			expect(crudSpy).toHaveBeenCalledWith([model]);
			expect(action.success).toBe(true);
		},
	);

	test.each([
		["/get-user-p2", "getUserP2"],
		["/get-user-conversation-subject", "getUserConversationSubject"],
		["/get-user-conversation-content", "getUserConversationContent"],
		["/get-user-guideline", "getUserGuideline"],
		["/get-user-avatar", "getUserAvatar"],
	] as [string, "getUserP2" | "getUserConversationSubject" | "getUserConversationContent" | "getUserGuideline" | "getUserAvatar"][])(
		"routes %s to custom %s",
		async (path, method) => {
			const action = createAction(path);
			const getSpy = jest
				.spyOn(action, method)
				.mockImplementation(async function (this: LLMAction) {
					// Keep this high-risk DB path mocked so the test only verifies dispatch, not persistence.
					this.success = true;
				});

			await action.task();

			expect(getSpy).toHaveBeenCalledTimes(1);
			expect(action.success).toBe(true);
		},
	);
});
