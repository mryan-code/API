import { Sequelize } from "sequelize";
import { RequestLog, initRequestLog } from "../../models/RequestLog";

describe("RequestLog model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build throws before model init", () => {
		expect(() => {
			RequestLog.build({
				method: "GET",
				path: "/health",
				parameters: "{}",
			});
		}).toThrow(TypeError);
	});

	test("build succeeds after initRequestLog", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		// Regression guard: the model must be initialized before middleware calls RequestLog.create.
		initRequestLog(sequelize);

		const requestLog = RequestLog.build({
			method: "GET",
			path: "/health",
			parameters: "{}",
		});

		expect(requestLog).toBeInstanceOf(RequestLog);
		expect(RequestLog.primaryKeyAttributes).toContain("id");
	});
});
