import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class Login extends Model {
	declare id: number;
	declare user_id: number;
	declare created: Date;
	declare user_date: Date;
	declare action: number;
	declare user_agent: string;
	declare ip_address: string;
	declare latitude: string;
	declare longitude: string;
}

export const initLogin = (sequelize: Sequelize) => {
	Login.init(
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
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			user_date: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			action: {
				type: DataTypes.INTEGER,
				allowNull: false,
				comment: "1 == Login, 2 == Logout",
			},
			user_agent: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			ip_address: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			latitude: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			longitude: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			name: {
				singular: "Login",
				plural: "Login",
			},
			tableName: "tbllogin",
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
