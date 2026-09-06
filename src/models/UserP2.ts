import { DataTypes, Model, Sequelize } from "sequelize";

// Stores user memory text blocks so memory prompts can be persisted per user.
export class UserP2 extends Model {
	declare id: number;
	declare key: string;
	declare value: string;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initUserP2 = (sequelize: Sequelize) => {
	UserP2.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			key: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			value: {
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
				singular: "UserP2",
				plural: "UserP2",
			},
			tableName: "tbluser_p2",
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
