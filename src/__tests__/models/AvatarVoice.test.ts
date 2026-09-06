import { Sequelize } from "sequelize";
import { AvatarVoice, initAvatarVoice } from "../../models/AvatarVoice";

describe("AvatarVoice model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build succeeds after initAvatarVoice", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		initAvatarVoice(sequelize);

		const avatarVoice = AvatarVoice.build({
			label: "Heart",
			option: "af_heart",
			gender: "f",
		});

		expect(avatarVoice).toBeInstanceOf(AvatarVoice);
		expect(AvatarVoice.tableName).toBe("tblavatar_voice");
		expect(AvatarVoice.getAttributes().label.allowNull).toBe(false);
		expect(AvatarVoice.getAttributes().option.allowNull).toBe(false);
		expect(AvatarVoice.getAttributes().gender.allowNull).toBe(false);
		expect(AvatarVoice.getAttributes().deleted.defaultValue).toBe(0);
	});
});
