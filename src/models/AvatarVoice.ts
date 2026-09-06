import { DataTypes, Model, Sequelize } from "sequelize";

// Stores avatar voice lookup options so clients can list selectable voices.
export class AvatarVoice extends Model {
	declare id: number;
	declare label: string;
	declare option: string;
	declare gender: string;
	declare created: Date;
	declare deleted: number;
}

export const initAvatarVoice = (sequelize: Sequelize) => {
	AvatarVoice.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			label: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			option: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			gender: {
				type: DataTypes.STRING(1),
				allowNull: false,
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
				singular: "AvatarVoice",
				plural: "AvatarVoice",
			},
			tableName: "tblavatar_voice",
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
