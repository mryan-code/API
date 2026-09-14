import { Sequelize } from "sequelize";
import {
	PicturePuzzleImage,
	initPicturePuzzleImage,
} from "../../models/PicturePuzzleImage";

describe("PicturePuzzleImage model initialization", () => {
	let sequelize: Sequelize;

	afterEach(async () => {
		if (sequelize) {
			await sequelize.close();
		}
	});

	test("build succeeds after initPicturePuzzleImage", () => {
		sequelize = new Sequelize("test_db", "test_user", "test_pass", {
			// Match production dialect so model init exercises the Postgres data-type mappings.
			dialect: "postgres",
			logging: false,
		});

		initPicturePuzzleImage(sequelize);

		const picturePuzzleImage = PicturePuzzleImage.build({
			blob: Buffer.from("puzzle-image-bytes"),
			user_id: 1,
		});

		expect(picturePuzzleImage).toBeInstanceOf(PicturePuzzleImage);
		expect(PicturePuzzleImage.tableName).toBe("tblpicture_puzzle_image");
		expect(PicturePuzzleImage.primaryKeyAttributes).toContain("id");
		expect(PicturePuzzleImage.getAttributes().blob.allowNull).toBe(false);
		expect(PicturePuzzleImage.getAttributes().user_id.allowNull).toBe(
			false,
		);
		expect(PicturePuzzleImage.getAttributes().created.allowNull).toBe(
			false,
		);
		expect(PicturePuzzleImage.getAttributes().deleted.defaultValue).toBe(
			0,
		);
		expect(
			PicturePuzzleImage.options.indexes?.some(
				(index) =>
					Array.isArray(index.fields) &&
					index.fields.includes("user_id") &&
					index.unique !== true,
			),
		).toBe(true);
	});
});
