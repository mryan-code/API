import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class ErrorLog extends Model {
	declare id: number;
	declare created: Date;
	declare message: string;
	declare line: string;
	declare file: string;
	declare url: string;
	declare user_ip: string;
	declare user_agent: string;
	declare resolved: number;
	declare stack: string;
	declare environment: string;
	declare type: string;
}

export const initErrorLog = (sequelize: Sequelize) => {
	ErrorLog.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			message: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			line: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			file: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			url: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			user_ip: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			user_agent: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resolved: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
				comment: "1 == resolved, 0 == not",
			},
			stack: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			environment: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			type: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			name: {
				singular: "ErrorLog",
				plural: "ErrorLog",
			},
			tableName: "tblerror_log",
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
