import { Request, Response } from "express";
import { Op } from "sequelize";
import { LLMAction } from "../../actions/LLMAction";
import * as models from "../../models";

jest.mock("../../models", () => {
	return {
		AvatarVoice: {
			name: "AvatarVoice",
			findAll: jest.fn(),
		},
	};
});

describe("LLMAction getAvatarVoice", () => {
	const createAction = () => {
		return new LLMAction(
			{
				path: "/get-avatar-voice",
				body: {},
				headers: {},
			} as Request,
			{} as Response,
			false,
		);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("returns undeleted voices ordered by gender then label", async () => {
		const action = createAction();

		(models.AvatarVoice.findAll as jest.Mock).mockResolvedValue([
			{
				get: jest.fn().mockReturnValue({
					avatar_voice_id: 3,
					label: "Adam",
					option: "am_adam",
					gender: "m",
				}),
			},
			{
				get: jest.fn().mockReturnValue({
					avatar_voice_id: 1,
					label: "Alloy",
					option: "af_alloy",
					gender: "f",
				}),
			},
			{
				get: jest.fn().mockReturnValue({
					avatar_voice_id: 2,
					label: "Heart",
					option: "af_heart",
					gender: "f",
				}),
			},
		]);

		await action.getAvatarVoice();

		expect(models.AvatarVoice.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					deleted: { [Op.eq]: 0 },
				},
				order: [
					["gender", "ASC"],
					["label", "ASC"],
				],
			}),
		);
		expect(action.success).toBe(true);
		expect(action.results).toEqual([
			{
				avatar_voice_id: "3",
				label: "Adam",
				option: "am_adam",
				gender: "m",
			},
			{
				avatar_voice_id: "1",
				label: "Alloy",
				option: "af_alloy",
				gender: "f",
			},
			{
				avatar_voice_id: "2",
				label: "Heart",
				option: "af_heart",
				gender: "f",
			},
		]);
	});
});
