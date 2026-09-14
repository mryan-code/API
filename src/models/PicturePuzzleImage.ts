import { DataTypes, Model, Sequelize } from "sequelize";

// Stores picture-puzzle image bytes so each saved image can be linked back to its owner.
export class PicturePuzzleImage extends Model {
	declare id: number;
	declare blob: Buffer;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initPicturePuzzleImage = (sequelize: Sequelize) => {
	PicturePuzzleImage.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			blob: {
				// BLOB maps to Postgres BYTEA for the binary puzzle image payload.
				type: DataTypes.BLOB,
				allowNull: false,
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "tbluser",
					key: "id",
				},
			},
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			deleted: {
				// SMALLINT replaces MySQL TINYINT; Postgres has no TINYINT type.
				type: DataTypes.SMALLINT,
				allowNull: false,
				defaultValue: 0,
				comment: "0 == not deleted, 1 == deleted",
			},
		},
		{
			sequelize,
			name: {
				singular: "PicturePuzzleImage",
				plural: "PicturePuzzleImage",
			},
			tableName: "tblpicture_puzzle_image",
			timestamps: false,
			indexes: [
				{
					name: "PRIMARY",
					using: "BTREE",
					unique: true,
					fields: ["id"],
				},
				{
					name: "user_id",
					using: "BTREE",
					unique: false,
					fields: ["user_id"],
				},
			],
		},
	);
};
