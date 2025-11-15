const { Markup } = require("telegraf");
const { Session } = require("../../models/session.model");
const { findUserByTelegramId } = require("../../services/user.service");
const { handleError } = require("../middlewares/error.handler");
const { Student } = require("../../models/student.model");
const { Payment } = require("../../models/payment.model");

function reportAction(bot) {
  bot.action("report_attendance_list", async (ctx) => {
    try {
      await ctx.deleteMessage();

      const user = await findUserByTelegramId(ctx?.chat?.id);

      if (!user?.club_id)
        return await ctx.reply("باشگاهی برای شما ثبت نشده است.");
      const sessions = await Session.findAll({
        where: { club_id: user.club_id },
        attributes: ["id", "name"],
        raw: true,
      });

      if (!sessions.length)
        return await ctx.reply(
          "هنوز هیچ کلاسی ثبت نکردید. ابتدا کلاس ثبت کنید."
        );

      const keyboard = sessions.map((s) => [
        Markup.button.callback(
          s.name,
          `select_session_report_attendance_${s.id}`
        ),
      ]);

      keyboard.push([Markup.button.callback("بازگشت", "return_main_menu")]);

      await ctx.reply("لطفا یک کلاس برای گزارش حضور و غیاب انتخاب کنید:", {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

      bot.action(/select_session_report_attendance_(\d+)/, async (ctx) => {
        const sessionId = Number(ctx.match[1]);
        ctx.session.selectedSessionId = sessionId;
        const menuMessageId = ctx.callbackQuery?.message?.message_id;
        await ctx.scene.enter("reportAttendance-scene", { menuMessageId });
      });
    } catch (error) {
      handleError(ctx, error, "نمایش گزارش حضور و غیاب با مشکل مواجه شد.");
    }
  });
  bot.action("report_tuition_payments", async (ctx) => {
    try {
      await ctx.deleteMessage();

      const user = await findUserByTelegramId(ctx.chat.id);
      if (!user?.club_id)
        return await ctx.reply("باشگاهی برای شما ثبت نشده است.");

      const students = await Student.findAll({
        where: { club_id: user.club_id },
      });
      if (!students.length) return await ctx.reply("هیچ هنرجویی ثبت نشده است.");

      const keyboard = students.map((s) => [
        Markup.button.callback(s.full_name, `report_tuition_student_${s.id}`),
      ]);
      keyboard.push([Markup.button.callback("بازگشت", "return_main_menu")]);

      await ctx.reply("برای مشاهده گزارش شهریه، یک هنرجو را انتخاب کنید:", {
        reply_markup: { inline_keyboard: keyboard },
      });

      bot.action(/report_tuition_student_(\d+)/, async (ctx) => {
        const studentId = Number(ctx.match[1]);
        const student = await Student.findByPk(studentId);

        const payments = await Payment.findAll({
          where: { student_id: studentId, payment_type: "شهریه" },
          order: [["payment_date", "DESC"]],
          raw: true,
        });

        if (!payments.length)
          return ctx.reply(
            `💰 هیچ پرداخت شهریه‌ای برای ${student.full_name} ثبت نشده است.`
          );

        let total = 0;
        const list = payments
          .map((p, i) => {
            total += parseFloat(p.amount);
            return `${i + 1}️⃣ ${p.month || "-"} — ${Number(
              p.amount
            ).toLocaleString()} تومان`;
          })
          .join("\n");

        const msg = `
📋 گزارش پرداخت شهریه برای ${student.full_name}

${list}

💵 مجموع پرداختی: ${total.toLocaleString()} تومان
`;
        await ctx.reply(
          msg,
          Markup.inlineKeyboard([
            [Markup.button.callback("بازگشت", "report_menu")],
          ])
        );
      });
    } catch (error) {
      handleError(ctx, error, "خطا در گزارش شهریه‌ها");
    }
  });
  bot.action("report_equipment_purchases", async (ctx) => {
    try {
      await ctx.deleteMessage();

      const user = await findUserByTelegramId(ctx.chat.id);
      if (!user?.club_id)
        return await ctx.reply("باشگاهی برای شما ثبت نشده است.");

      const students = await Student.findAll({
        where: { club_id: user.club_id },
      });
      if (!students.length) return await ctx.reply("هیچ هنرجویی ثبت نشده است.");

      const keyboard = students.map((s) => [
        Markup.button.callback(s.full_name, `report_equipment_student_${s.id}`),
      ]);
      keyboard.push([Markup.button.callback("بازگشت", "return_main_menu")]);

      await ctx.reply("برای مشاهده گزارش خرید تجهیزات، هنرجو را انتخاب کنید:", {
        reply_markup: { inline_keyboard: keyboard },
      });

      bot.action(/report_equipment_student_(\d+)/, async (ctx) => {
        const studentId = Number(ctx.match[1]);
        const student = await Student.findByPk(studentId);

        const payments = await Payment.findAll({
          where: { student_id: studentId, payment_type: "تجهیزات" },
          order: [["payment_date", "DESC"]],
          raw: true,
        });

        if (!payments.length)
          return ctx.reply(
            `🛍️ هیچ خرید تجهیزاتی برای ${student.full_name} ثبت نشده است.`
          );

        let total = 0;
        const list = payments
          .map((p, i) => {
            total += parseFloat(p.amount);
            return `${i + 1}️⃣ ${p.description || "-"} — ${Number(
              p.amount
            ).toLocaleString()} تومان (${p.payment_date.toLocaleDateString(
              "fa-IR"
            )})`;
          })
          .join("\n");

        const msg = `
🛍️ گزارش خرید تجهیزات برای ${student.full_name}

${list}

💵 مجموع خریدها: ${total.toLocaleString()} تومان
`;
        await ctx.reply(
          msg,
          Markup.inlineKeyboard([
            [Markup.button.callback("بازگشت", "report_menu")],
          ])
        );
      });
    } catch (error) {
      handleError(ctx, error, "خطا در گزارش تجهیزات");
    }
  });

  bot.action("report_student_summary", async (ctx) => {});
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
  reportAction,
};
