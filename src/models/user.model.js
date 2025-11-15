const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const User = sequelize.define("user", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    telegram_user_id: { type: DataTypes.STRING, unique: true },
    club_id: { type: DataTypes.INTEGER, allowNull: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    phone_number: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
    createdAt: "created_at",
    updatedAt: false,
    freezeTableName: true
});

module.exports = {
    User
};