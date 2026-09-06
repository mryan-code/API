import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";
export class Page extends Model {
	declare id: number;
	declare name: string;
	declare slug: string;
	declare path: string;
	declare file: string;
	declare auth_required: number;
	declare auth_level: number;
	declare order: number;
	declare description: string;
	declare icon: string;
	declare created: Date;
	declare modified: Date;
	declare deleted: number;
	declare location: number;
	declare section_id: number;
}

export const initPage = (sequelize: Sequelize) => {
	Page.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			name: {
				type: DataTypes.STRING(20),
				allowNull: false,
			},
			slug: {
				type: DataTypes.STRING(20),
				allowNull: false,
			},
			path: {
				type: DataTypes.STRING(20),
				allowNull: false,
			},
			file: {
				type: DataTypes.STRING(20),
				allowNull: false,
			},
			auth_required: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 3,
				comment: "1 == Auth, 2 == No Auth, 3 == Both",
			},
			auth_level: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				comment: "0 == None, 1 == Admin, 2 == Manager, 3 == Supervisor, 4 == User",
			},
			order: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			description: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			icon: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			created: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
			modified: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss"),
				onUpdate: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
			deleted: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
				comment: "1 == deleted, 0 == not",
			},
			location: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
				comment: "0 == Hidden, 1 == Main, 2 == Header, 3 == Footer",
			},
			section_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: null,
				references: {
					model: "tblsection",
					key: "id",
				},
			},
		},
		{
			sequelize,
			name: {
				singular: "Page",
				plural: "Page",
			},
			tableName: "tblpage",
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
