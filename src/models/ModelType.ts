import { DataTypes, Model, Sequelize } from "sequelize";

// Stores allowed LLM model type values so clients can constrain model selection.
export class ModelType extends Model {
	declare id: number;
	declare model: string;
	declare created: Date;
	declare deleted: number;
}

export const initModelType = (sequelize: Sequelize) => {
	ModelType.init(
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			model: {
				type: DataTypes.STRING(255),
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
				singular: "ModelType",
				plural: "ModelType",
			},
			tableName: "tblmodel_type",
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
