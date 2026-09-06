import { DataTypes, Model, Sequelize } from "sequelize";
import moment from "moment";

export class Section extends Model {
	declare id: number;
	declare name: string;
	declare created: Date;
	declare modified: Date;
	declare deleted: number;
	declare front: string;
	declare auth_required: number;
	declare auth_level: number;
	declare icon: string;
}

export const initSection = (sequelize: Sequelize) => {
	Section.init(
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
			front_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: null,
				references: {
					model: "tblpage",
					key: "id",
				},
			},
			auth_required: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 3,
				comment: "1 == auth, 2 == no auth, 3 == both",
			},
			auth_level: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				comment: "0 == none, 1 == admin, 2 == manager, 3 == supervisor, 4 == user",
			},
			icon: {
				type: DataTypes.STRING(40),
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
		},
		{
			sequelize,
			name: {
				singular: "Section",
				plural: "Section",
			},
			tableName: "tblsection",
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
