const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const Payment = sequelize.define("payment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_type: { type: DataTypes.ENUM("شهریه", "تجهیزات"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    month: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.STRING, allowNull: true },
    payment_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
    createdAt: "created_at",
    updatedAt: false,
    freezeTableName: true
});

module.exports = {
    Payment
};
