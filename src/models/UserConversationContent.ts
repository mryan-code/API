import { DataTypes, Model, Sequelize } from "sequelize";

// Stores individual conversation messages linked to a user and a conversation subject thread.
export class UserConversationContent extends Model {
	declare id: number;
	declare response: string;
	declare user_id: number;
	declare user_conversation_subject_id: number;
	declare created: Date;
	declare deleted: number;
	declare prompt?: string; // Optional field for the prompt associated with the conversation message
}

export const initUserConversationContent = (sequelize: Sequelize) => {
	UserConversationContent.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			response: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "tbluser",
					key: "id",
				},
			},
			user_conversation_subject_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "tbluser_conversation_subject",
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
			prompt: {
				type: DataTypes.TEXT,
				allowNull: true,
				comment:
					"Optional field for the prompt associated with the conversation message",
			},
		},
		{
			sequelize,
			name: {
				singular: "UserConversationContent",
				plural: "UserConversationContent",
			},
			tableName: "tbluser_conversation_content",
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
					name: "user_conversation_subject_id",
					using: "BTREE",
					unique: false,
					fields: ["user_conversation_subject_id"],
				},
			],
		},
	);
};
