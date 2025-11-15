const { Markup } = require("telegraf");
const { Session } = require("../../models/session.model");
const { findUserByTelegramId } = require("../../services/user.service");
const { handleError } = require("../middlewares/error.handler");

function mainActions(bot) {
  bot.action("student_menu", async (ctx) => {
    try {
      await ctx.deleteMessage();
      const { studentMenu } = require("../menus/student.menu");
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        "لطفا گزینه مورد نظر را انتخاب کنید:",
        studentMenu()
      );
    } catch (error) {
      handleError(ctx, error, "نمایش منو هنرجو ها با مشکل مواجه شد.");
    }
  });
  bot.action("session_menu", async (ctx) => {
    try {
      await ctx.deleteMessage();
      const { sessionMenu } = require("../menus/session.menu");
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        "لطفا گزینه مورد نظر را انتخاب کنید:",
        sessionMenu()
      );
    } catch (error) {
      handleError(ctx, error, "نمایش منو جلسات با مشکل مواجه شد.");
    }
  });
  bot.action("attendance_menu", async (ctx) => {
    try {
      await ctx.deleteMessage().catch(() => {});
      const user = await findUserByTelegramId(ctx.chat.id);
      if (!user?.club_id)
        return await ctx.reply("باشگاهی برای شما ثبت نشده است.");

      const sessions = await Session.findAll({
        where: { club_id: user.club_id },
        attributes: ["id", "name"],
        raw: true,
      });

      if (!sessions.length)
        return await ctx.reply(
          "هنوز هیچ کلاسی ثبت نکردید. ابتدا کلاس ثبت کنید.",
          {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback("بازگشت", "return_main_menu")],
              ],
            },
          }
        );

      const keyboard = sessions.map((s) => [
        Markup.button.callback(s.name, `select_session_attendance_${s.id}`),
      ]);
      keyboard.push([Markup.button.callback("بازگشت", "return_main_menu")]);

      await ctx.reply("لطفاً یک کلاس برای ثبت حضور و غیاب انتخاب کنید:", {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
      bot.action(/select_session_attendance_(\d+)/, async (ctx) => {
        const sessionId = Number(ctx.match[1]);
        ctx.session.selectedSessionId = sessionId;
        await ctx.scene.enter("attendance-scene");
      });
    } catch (error) {
      handleError(ctx, error, "نمایش منو حضورغیاب با مشکل مواجه شد.");
    }
  });
  bot.action("payment_menu", async (ctx) => {
    try {
      await ctx.scene.enter("payment-scene");
    } catch (error) {
      handleError(ctx, error, "نمایش منو پرداخت ها با مشکل مواجه شد.");
    }
  });
  bot.action("report_menu", async (ctx) => {
    try {
      await ctx.deleteMessage();
      const { reportMenu } = require("../menus/report.menu");
      await ctx.reply("لطفا گزینه مورد نظر را انتخاب کنید:", reportMenu());
    } catch (error) {
      handleError(ctx, error, "نمایش منو گزارش ها با مشکل مواجه شد.");
    }
  });
}

module.exports = {
  mainActions,
};
