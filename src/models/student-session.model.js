const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const StudentSession = sequelize.define("student_session", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    session_id: { type: DataTypes.INTEGER, allowNull: false },
    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
}, {
    timestamps: false,
    freezeTableName: true,
    indexes: [
        {
            unique: true,
            fields: ["student_id", "session_id"]

        }
    ]
});

module.exports = {
    StudentSession
};