const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const Attendance = sequelize.define(
  "attendance",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    session_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM("حاضر", "غایب"), defaultValue: "حاضر" },
  },
  {
    timestamps: false,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "session_id", "date"],
      },
    ],
  }
);

module.exports = {
  Attendance,
};
