import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class RequestLog extends Model {
	declare id: number;
	declare created: Date;
	declare method: string;
	declare parameters: string;
	declare path: string;
	// Store request Origin header for auditing; nullable when absent.
	declare origin: string | null;
	declare user_agent: string | null;
	declare ip_address: string | null;
	declare geo_location: string | null;
}

export const initRequestLog = (sequelize: Sequelize) => {
	RequestLog.init(
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
			method: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			parameters: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			path: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			// Store request Origin header for auditing; nullable when absent.
			origin: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			user_agent: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			ip_address: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			geo_location: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			name: {
				singular: "RequestLog",
				plural: "RequestLog",
			},
			tableName: "tblrequest_log",
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
