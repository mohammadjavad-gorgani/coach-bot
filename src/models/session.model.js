const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const Session = sequelize.define("session", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
}, {
    createdAt: "created_at",
    updatedAt: false,
    freezeTableName: true
});

module.exports = {
    Session
};