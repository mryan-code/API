import express from "express";
import routes from "./routes/";
import * as middleware from "./middleware";
import cors from "cors";
import bodyParser from "body-parser";
const webpush = require("web-push");
import swaggerUi from "swagger-ui-express";
import swaggerJSON from "../swagger.json";
import * as types from "./types";
import helmet from "helmet";
import { getChalk } from "./functions/getChalk";
import { loadEnv } from "./functions/loadEnv";

loadEnv();
// app.ts is imported before index.ts assigns globalVars, so bootstrap it here when needed.
if (!globalThis.globalVars) {
	globalThis.globalVars = process.env as types.KeyValue;
}
const chalk = getChalk();

const app = express();

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				"script-src": [`'self'`, "https:", `'unsafe-inline'`],
				"connect-src": [`'self'`, "localhost:*"],
				"img-src": [`'self'`, "data:", "validator.swagger.io"],
				"style-src": [`'self'`, `'unsafe-inline'`],
				"default-src": [`'self'`],
			},
		},
	}),
);
const customSwaggerOptions: types.KeyValue = {
	customCss:
		".swagger-ui .topbar { display: none; } #messageWrapper { max-height: 300px; overflow-y: scroll }",
	// customJs: "/swagger.js",
};
let localSwaggerJSON = JSON.parse(JSON.stringify(swaggerJSON));

// Keep Swagger UI off the root path so API routes like /get-page are not shadowed.
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(localSwaggerJSON, customSwaggerOptions),
);

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(jsonParser);
app.use(urlencodedParser);
app.use(express.json());
app.use(middleware.reqParameters);
// app.use(middleware.logRequest);

// const vapidKeys = {
// 	publicKey: process.env.PUBLIC_VAPID,
// 	privateKey: process.env.PRIVATE_VAPID,
// };
// webpush.setVapidDetails(
// 	"mailto:coded.cortex@gmail.com",
// 	vapidKeys.publicKey,
// 	vapidKeys.privateKey,
// );
// globalThis.globalVars.webpush = webpush;

// const vapidKeys = webpush.generateVAPIDKeys();
// console.log(vapidKeys);

// Subscribe endpoint
// app.post("/subscribe", (req, res) => {
// 	const subscription = req.body;
// 	res.status(201).json({});
// 	// Send notification to the subscriber
// 	webpush
// 		.sendNotification(subscription, JSON.stringify({ title: "Push Alert" }))
// 		.catch((err: any) => console.error(err));
// });
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log(vapidKeys);

const corsOrigins =
	process.env.CORS_ORIGIN?.split(",").map(origin => origin.trim()) || [];
export const corsOptions = {
	origin: "*",
	optionsSuccessStatus: 200,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("/{*cors_preflight}", cors(corsOptions));
// app.use(middleware.cronRequest);
app.use(routes);
app.use(middleware.errorRequest);
app.use(middleware.notFound);

export default app;
