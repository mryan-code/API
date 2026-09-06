import { DataTypes, Model, Sequelize } from "sequelize";

// Stores user avatar payloads so avatar history can be persisted per user.
export class UserAvatar extends Model {
	declare id: number;
	declare avatar_name: string | null;
	declare user_name: string | null;
	declare persona_humorous_serious: number | null;
	declare persona_emotional_rational: number | null;
	declare persona_informal_business: number | null;
	declare persona_playful_strict: number | null;
	declare persona_quirky_conventional: number | null;
	declare persona_slang_formal: number | null;
	declare avatar_voice: string | null;
	declare avatar_details: string | null;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
	declare avatar_nsfw: number;
	declare user_pronouns: string;
}

export const initUserAvatar = (sequelize: Sequelize) => {
	UserAvatar.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			avatar_name: {
				type: DataTypes.STRING(75),
				allowNull: true,
				defaultValue: "Avatar",
			},
			user_name: {
				type: DataTypes.STRING(75),
				allowNull: true,
				defaultValue: "User",
			},
			persona_emotional_rational: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			persona_humorous_serious: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			persona_informal_business: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			persona_playful_strict: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			persona_quirky_convensional: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			persona_slang_formal: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 50,
			},
			avatar_voice: {
				type: DataTypes.STRING(50),
				allowNull: true,
				defaultValue: "af_heart",
			},
			avatar_details: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: "",
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
			avatar_nsfw: {
				// SMALLINT replaces MySQL TINYINT; Postgres has no TINYINT type.
				type: DataTypes.SMALLINT,
				allowNull: true,
				defaultValue: 0,
				comment: "0 == not nsfw, 1 == nsfw",
			},
			user_pronouns: {
				type: DataTypes.STRING(50),
				allowNull: true,
				defaultValue: "",
			},
		},
		{
			sequelize,
			name: {
				singular: "UserAvatar",
				plural: "UserAvatar",
			},
			tableName: "tbluser_avatar",
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
