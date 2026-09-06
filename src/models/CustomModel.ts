import { DataTypes, Model as SequelizeModel, Sequelize } from "sequelize";

// Tracks downloaded LLM models by user so the API can reuse local model assets.
export class CustomModel extends SequelizeModel {
	declare id: number;
	declare label: string;
	declare model_label: string;
	declare model_name: string;
	declare model_type: string;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initCustomModel = (sequelize: Sequelize) => {
	CustomModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			// Required short label for UI display and quick model selection.
			label: {
				type: DataTypes.STRING(20),
				allowNull: false,
				defaultValue: "",
			},
			model_label: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			model_name: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			model_type: {
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
				singular: "CustomModel",
				plural: "CustomModels",
			},
			tableName: "tblcustom_model",
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
