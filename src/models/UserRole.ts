import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class UserRole extends Model {
	declare id: number;
	declare user_id: number;
	declare role_id: number;
	declare created: Date;
}

export const initUserRole = (sequelize: Sequelize) => {
	UserRole.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "tbluser",
					key: "id",
				},
			},
			role_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "tblrole",
					key: "id",
				},
			},
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			sequelize,
			name: {
				singular: "UserRole",
				plural: "UserRole",
			},
			tableName: "tbluser_role",
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
				{
					name: "role_id",
					using: "BTREE",
					unique: false,
					fields: ["role_id"],
				},
			],
		},
	);
};
