import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "@jest/globals";

describe("app", () => {
	it("mounts Swagger UI under /api-docs instead of the root path", () => {
		const appSource = readFileSync(resolve(__dirname, "../app.ts"), "utf8");
		// Normalize formatting so the test verifies behavior instead of one-line source layout.
		const normalizedAppSource = appSource.replace(/\s+/g, " ");

		expect(normalizedAppSource).toContain(
			'app.use( "/api-docs", swaggerUi.serve, swaggerUi.setup(localSwaggerJSON, customSwaggerOptions), );',
		);
		expect(normalizedAppSource).not.toContain(
			'app.use( "/", swaggerUi.serve, swaggerUi.setup(localSwaggerJSON, customSwaggerOptions), );',
		);
	});
});
