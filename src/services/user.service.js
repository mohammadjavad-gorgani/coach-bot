const { User } = require("../models/user.model")

async function findUserByTelegramId(telegramId) {
    return await User.findOne({ where: { telegram_user_id: telegramId } });
};

module.exports = {
    findUserByTelegramId
}