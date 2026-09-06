import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class User extends Model {
	declare id: number;
	declare email: string;
	declare password: string;
	declare avatar: string;
	declare first_name: string;
	declare last_name: string;
	declare created: Date;
	declare modified: Date;
	declare deleted: number;
	declare login_token: string;
	declare auth_code: string;
	declare auth_code_expires: Date;
	declare timezone: string;
	declare setup_complete: number;
}

export const initUser = (sequelize: Sequelize) => {
	User.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			avatar: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "user-placeholder.svg",
			},
			first_name: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "",
			},
			last_name: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "",
			},
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			modified: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
				// Ensure modified timestamps update automatically on write.
				onUpdate: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
			},
			deleted: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
				comment: "1 == deleted, 0 == not",
			},
			login_token: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			auth_code: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			auth_code_expires: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			timezone: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "Canada/Toronto",
			},
			setup_complete: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			name: {
				singular: "User",
				plural: "User",
			},
			tableName: "tbluser",
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
