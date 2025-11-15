const { Scenes, Markup } = require("telegraf");
const { findUserByTelegramId } = require("../../services/user.service");
const { Session } = require("../../models/session.model");
const { StudentSession } = require("../../models/student-session.model");
const { Student } = require("../../models/student.model");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");

const sessionListScene = new Scenes.BaseScene("session-list");

sessionListScene.enter(async (ctx) => {
  try {
    const user = await findUserByTelegramId(ctx.chat.id);
    if (!user?.club_id) {
      return ctx.reply("باشگاهی برای شما ثبت نشده است.");
    }

    const sessions = await Session.findAll({
      where: { club_id: user.club_id },
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    if (!sessions.length) {
      return ctx.reply("هیچ کلاسی ثبت نکردید. ابتدا یک کلاس ایجاد کنید.");
    }

    const buttons = sessions.map((s) => [
      Markup.button.callback(s.name, `view_session_${s.id}`),
    ]);
    buttons.push([
      Markup.button.callback("🔙 بازگشت به منو اصلی", "return_main_menu"),
    ]);

    await ctx.reply("📋 لطفا یک کلاس را انتخاب کنید:", {
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ خطا در نمایش لیست کلاس‌ها.");
  }
});

sessionListScene.action(/view_session_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const sessionId = Number(ctx.match[1]);
    const session = await Session.findByPk(sessionId);

    if (!session) return ctx.reply("❌ کلاس یافت نشد.");

    const studentCount = await StudentSession.count({
      where: { session_id: session.id },
    });

    const details = `📝 نام کلاس: ${session.name}\n📅 توضیحات: ${
      session.description || "ندارد"
    }\n👥 تعداد هنرجویان: ${studentCount}`;

    await ctx.reply(details, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✏️ ویرایش", callback_data: `edit_session_${session.id}` },
            { text: "🗑️ حذف", callback_data: `delete_session_${session.id}` },
          ],
          [{ text: "🔙 بازگشت", callback_data: "return_to_session_list" }],
        ],
      },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ خطا در نمایش جزئیات کلاس.");
  }
});

sessionListScene.action(/delete_session_(\d+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const sessionId = Number(ctx.match[1]);

  await ctx.reply("آیا از حذف این کلاس اطمینان دارید؟", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ بله، حذف شود",
            callback_data: `confirm_delete_${sessionId}`,
          },
        ],
        [{ text: "❌ خیر، بازگشت", callback_data: "cancel_delete" }],
      ],
    },
  });
});

sessionListScene.action(/confirm_delete_(\d+)/, async (ctx) => {
  try {
    const id = Number(ctx.match[1]);
    await StudentSession.destroy({ where: { session_id: id } });
    await Session.destroy({ where: { id } });

    await ctx.reply("✅ کلاس با موفقیت حذف شد.");
    await ctx.scene.leave();
    await ctx.telegram.sendMessage(
      ctx.chat.id,
      mainMenuMessages.mainText,
      mainMenu()
    );
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ خطا در حذف کلاس.");
  }
});

sessionListScene.action("cancel_delete", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("❌ حذف لغو شد.");
});

sessionListScene.action("return_to_session_list", async (ctx) => {
  await ctx.scene.reenter();
});

sessionListScene.action("return_main_menu", async (ctx) => {
  await ctx.scene.leave();
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    mainMenuMessages.mainText,
    mainMenu()
  );
});

sessionListScene.action(/edit_session_(\d+)/, async (ctx) => {
  ctx.session.editingSessionId = Number(ctx.match[1]);
  await ctx.scene.enter("edit-session");
});

module.exports = { sessionListScene };
