import { testAuthorizationHeader } from "../../middleware/testAuthorizationHeader";
import * as functions from "../../functions";
import * as models from "../../models";

jest.mock("../../functions", () => ({
	verifyJWT: jest.fn(),
	decodeJWT: jest.fn(),
	decryptHash: jest.fn(),
}));

jest.mock("../../models", () => ({
	User: {
		findOne: jest.fn(),
	},
}));

type MockResponse = {
	headersSent: boolean;
	status: jest.Mock;
	json: jest.Mock;
	end: jest.Mock;
};

const createMockResponse = (): MockResponse => {
	const response = {
		headersSent: false,
		status: jest.fn().mockReturnThis(),
		json: jest.fn().mockReturnThis(),
		end: jest.fn().mockReturnThis(),
	};
	return response;
};

describe("testAuthorizationHeader", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 401 without throwing when request body is missing", async () => {
		const req = {
			headers: {},
		} as any;
		const res = createMockResponse() as any;

		const result = await testAuthorizationHeader(req, res);

		expect(result.value).toBe(false);
		expect(result.code).toBe(401);
		expect(result.message).toBe("Missing authorization credentials!");
		expect(res.status).toHaveBeenCalledWith(401);
		expect(functions.verifyJWT as jest.Mock).not.toHaveBeenCalled();
	});

	it("accepts Bearer token from authorization header", async () => {
		const req = {
			headers: {
				authorization: "Bearer raw-header-token",
			},
		} as any;
		const res = createMockResponse() as any;

		(functions.verifyJWT as jest.Mock).mockResolvedValue(true);
		(functions.decodeJWT as jest.Mock).mockResolvedValue({
			user_id: 11,
			login_token: "decoded-token",
		});
		(models.User.findOne as jest.Mock).mockResolvedValue({
			login_token: "encrypted-login-token",
		});
		(functions.decryptHash as jest.Mock).mockResolvedValue("decoded-token");

		const result = await testAuthorizationHeader(req, res);

		expect(result.value).toBe(true);
		expect(result.code).toBe(200);
		expect(functions.verifyJWT).toHaveBeenCalledWith("raw-header-token");
		expect(models.User.findOne).toHaveBeenCalled();
	});
});
