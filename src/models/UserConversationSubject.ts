import { DataTypes, Model, Sequelize } from "sequelize";

// Stores conversation subjects grouped by user so messages can be organized into threads.
export class UserConversationSubject extends Model {
	declare id: number;
	declare subject: string;
	declare user_id: number;
	declare created: Date;
	declare deleted: number;
}

export const initUserConversationSubject = (sequelize: Sequelize) => {
	UserConversationSubject.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			subject: {
				type: DataTypes.STRING(100),
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
				singular: "UserConversationSubject",
				plural: "UserConversationSubject",
			},
			tableName: "tbluser_conversation_subject",
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
