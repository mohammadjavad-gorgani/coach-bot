const { Scenes } = require("telegraf");
const { Session } = require("../../models/session.model");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");

const editSessionScene = new Scenes.WizardScene(
  "edit-session",

  async (ctx) => {
    const sessionId = ctx.session.editingSessionId;
    const session = await Session.findByPk(sessionId);

    if (!session) {
      await ctx.reply("❌ کلاس یافت نشد.");
      return ctx.scene.leave();
    }

    ctx.wizard.state.session = session;
    await ctx.reply(
      `✏️ در حال ویرایش کلاس "${session.name}" هستید.\nلطفاً نام جدید را وارد کنید یا "بدون تغییر" بنویسید.`
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const input = ctx.message.text.trim();
    const session = ctx.wizard.state.session;

    ctx.wizard.state.newName = input === "بدون تغییر" ? session.name : input;
    await ctx.reply(
      "📝 توضیح جدید را وارد کنید یا بنویسید «بدون تغییر» اگر نمی‌خواهید ویرایش کنید."
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const input = ctx.message.text.trim();
    const newDesc = input === "بدون تغییر" ? null : input;
    const session = ctx.wizard.state.session;

    try {
      session.name = ctx.wizard.state.newName;
      session.description = newDesc;
      await session.save();

      await ctx.reply("✅ اطلاعات کلاس با موفقیت ویرایش شد.");
      await ctx.scene.leave();
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        mainMenuMessages.mainText,
        mainMenu()
      );
    } catch (error) {
      console.error(error);
      await ctx.reply("⚠️ خطا در ویرایش اطلاعات کلاس.");
    }
  }
);

module.exports = { editSessionScene };
