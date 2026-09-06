import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class Role extends Model {
	declare id: number;
	declare name: string;
	declare created: Date;
	declare modified: Date;
	declare deleted: number;
	declare auth_level: number;
}

export const initRole = (sequelize: Sequelize) => {
	Role.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
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
			auth_level: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 4,
				comment: "1 == admin, 2 == manager, 3 == supervisor, 4 == agent",
			},
		},
		{
			sequelize,
			name: {
				singular: "Role",
				plural: "Role",
			},
			tableName: "tblrole",
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
