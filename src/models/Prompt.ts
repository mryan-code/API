import { DataTypes, Model, Sequelize } from "sequelize";

// Stores user-authored prompts so LLM features can persist prompt history per user.
export class Prompt extends Model {
	declare id: number;
	declare prompt: string;
	declare response: string;
	declare mime_type: string;
	declare base64: string;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initPrompt = (sequelize: Sequelize) => {
	Prompt.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			prompt: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			response: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			mime_type: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			base64: {
				type: DataTypes.TEXT,
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
				singular: "Prompt",
				plural: "Prompt",
			},
			tableName: "tblprompt",
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
