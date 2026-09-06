import { Request, Response, Router, NextFunction } from "express";
import * as actions from "../actions";
import * as models from "../models";

const routes = Router();

// App
routes.post("/start-app", async (req: Request, res: Response) => {
	const Action = new actions.AppAction(req, res, true);
	await Action.Action();
});

// Authentication
routes.post("/login-auth", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, false);
	await Action.Action();
});
routes.post("/logout-auth", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, true);
	await Action.Action();
});
routes.post("/verify-auth", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, false);
	await Action.Action();
});
routes.post("/test-auth", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, false);
	await Action.Action();
});
routes.get("/get-settings", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, true);
	await Action.Action();
});
routes.post("/registeration", async (req: Request, res: Response) => {
	const Action = new actions.AuthAction(req, res, false);
	await Action.Action();
});

// Page
routes.get("/get-page", async (req: Request, res: Response) => {
	const Action = new actions.PageAction(req, res, false);
	await Action.Action();
});
routes.post("/add-page", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Page]);
	await Action.Action();
});
routes.post("/save-page", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Page]);
	await Action.Action();
});
routes.delete("/delete-page", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Page]);
	await Action.Action();
});

// User
routes.post("/add-user", async (req: Request, res: Response) => {
	const Action = new actions.UserAction(req, res, true);
	await Action.Action();
});
routes.get("/get-user", async (req: Request, res: Response) => {
	const Action = new actions.UserAction(req, res, true);
	await Action.Action();
});
routes.post("/save-user", async (req: Request, res: Response) => {
	const Action = new actions.UserAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-user", async (req: Request, res: Response) => {
	const Action = new actions.UserAction(req, res, true);
	await Action.Action();
});

// Role
routes.post("/add-role", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Role]);
	await Action.Action();
});
routes.post("/save-role", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Role]);
	await Action.Action();
});
routes.get("/get-role", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Role]);
	await Action.Action();
});
routes.delete("/delete-role", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.Role]);
	await Action.Action();
});

// ErrorLog
routes.post("/add-errorlog", async (req: Request, res: Response) => {
	const Action = new actions.GenericAction(req, res, true, [models.ErrorLog]);
	await Action.Action();
});
routes.get("/get-errorlog", async (req: Request, res: Response) => {
	const Action = new actions.ErrorLogAction(req, res, true);
	await Action.Action();
});
routes.post("/save-errorlog", async (req: Request, res: Response) => {
	const Action = new actions.ErrorLogAction(req, res, true);
	await Action.Action();
});
routes.get("/get-requestlog", async (req: Request, res: Response) => {
	const Action = new actions.ErrorLogAction(req, res, true);
	await Action.Action();
});

// LLM
routes.get("/health", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/chat", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/custom-model", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/system-model", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, false);
	await Action.Action();
});
routes.put("/add-global-rule", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/save-global-rule", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-global-rule", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-global-rule", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.put("/add-model-type", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/save-model-type", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-model-type", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-model-type", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.put("/add-user-p2", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/save-user-p2", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-user-p2", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-user-p2", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.put(
	"/add-user-conversation-subject",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.post(
	"/save-user-conversation-subject",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.get(
	"/get-user-conversation-subject",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.delete(
	"/delete-user-conversation-subject",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.put(
	"/add-user-conversation-content",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.post(
	"/save-user-conversation-content",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.get(
	"/get-user-conversation-content",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.delete(
	"/delete-user-conversation-content",
	async (req: Request, res: Response) => {
		const Action = new actions.LLMAction(req, res, true);
		await Action.Action();
	},
);
routes.get("/get-user-conversation", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.put("/add-user-guideline", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/save-user-guideline", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-user-guideline", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-user-guideline", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.put("/add-user-avatar", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.post("/save-user-avatar", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-user-avatar", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.delete("/delete-user-avatar", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-avatar-voice", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});
routes.get("/get-user-chat", async (req: Request, res: Response) => {
	const Action = new actions.LLMAction(req, res, true);
	await Action.Action();
});

export default routes;
