import { DataTypes, Model, Sequelize } from "sequelize";

// Stores global rules used by the LLM workflow, including strict-mode enforcement.
export class GlobalRule extends Model {
	declare id: number;
	declare rule: string;
	declare summary: string | null;
	declare strict: number;
	declare created: Date;
	declare deleted: number;
}

export const initGlobalRule = (sequelize: Sequelize) => {
	GlobalRule.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			rule: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			// Optional short description used by clients when they need a concise rule preview.
			summary: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			strict: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
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
				singular: "GlobalRule",
				plural: "GlobalRule",
			},
			tableName: "tblglobal_rule",
			timestamps: false,
			indexes: [
				{
					name: "PRIMARY",
					using: "BTREE",
					unique: true,
					fields: ["id"],
				},
			],
		},
	);
};
