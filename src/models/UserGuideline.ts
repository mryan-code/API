import { DataTypes, Model, Sequelize } from "sequelize";

// Stores user-level guideline text that shapes memory and LLM response behavior.
export class UserGuideline extends Model {
	declare id: number;
	declare guideline: string;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initUserGuideline = (sequelize: Sequelize) => {
	UserGuideline.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			guideline: {
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
				singular: "UserGuideline",
				plural: "UserGuideline",
			},
			tableName: "tbluser_guideline",
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
