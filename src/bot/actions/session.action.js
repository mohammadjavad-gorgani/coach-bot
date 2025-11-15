const { findAllSessionsByClubId } = require("../../services/session.service");
const { findUserByTelegramId } = require("../../services/user.service");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const { handleError } = require("../middlewares/error.handler");

function sessionAction(bot) {
  bot.action("add_session_menu", async (ctx) => {
    try {
      await ctx.scene.enter("session-registration");
    } catch (error) {
      handleError(ctx, error, "افزودن کلاس با مشکل مواجه شد.");
    }
  });
  bot.action("get_sessions_menu", async (ctx) => {
    try {
      await ctx.scene.enter("session-list");
    } catch (error) {
      handleError(ctx, error, "نمایش لیست کلاس‌ها با مشکل مواجه شد.");
    }
  });
  bot.action("return_main_menu", async (ctx) => {
    try {
      await ctx.deleteMessage();
      const { mainMenu } = require("../menus/main.menu");
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        mainMenuMessages.mainText,
        mainMenu()
      );
    } catch (error) {
      handleError(ctx, error, "بازگشت به منو اصلی با مشکل مواجه شد.");
    }
  });
}

module.exports = {
  sessionAction,
};
