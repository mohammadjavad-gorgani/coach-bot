const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const Club = sequelize.define("club", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
    createdAt: "created_at",
    updatedAt: false,
    freezeTableName: true
});

module.exports = {
    Club
};