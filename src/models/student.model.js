const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const Student = sequelize.define(
  "student",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: false },
    phone_number: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    createdAt: "created_at",
    updatedAt: false,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["phone_number", "club_id"],
      },
    ],
  }
);

module.exports = {
  Student,
};
