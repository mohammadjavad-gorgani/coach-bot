const { Scenes, Markup } = require("telegraf");
const {
  sessionValidationSchema,
} = require("../../validations/sessionRegistration.validation");
const { findUserByTelegramId } = require("../../services/user.service");
const { Session } = require("../../models/session.model");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const { handleError } = require("../middlewares/error.handler");

const sessionRegistration = new Scenes.WizardScene(
  "session-registration",

  async (ctx) => {
    await ctx.deleteMessage().catch(() => {});
    await ctx.reply(
      "لطفا نام کلاس خود را وارد کنید: (مثلا 👈 شنبه، دوشنبه، چهارشنبه ساعت 14:30)"
    );
    await ctx.reply(
      "برای لغو عملیات کلیک کنید:",
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ لغو", "cancel_session_reg")],
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const session_name = ctx.message.text?.trim();
    const { error } = sessionValidationSchema
      .extract("session_name")
      .validate(session_name);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.session_name = session_name;

    const skip = await ctx.telegram.sendMessage(
      ctx.chat.id,
      "لطفا اگر کلاس شما توضیحاتی دارد وارد کنید:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "در حال حاضر توضیحاتی ندارم",
                callback_data: "skip_desc",
              },
            ],
            [{ text: "❌ لغو", callback_data: "cancel_session_reg" }],
          ],
        },
      }
    );
    ctx.wizard.state.skipMessageId = skip.message_id;

    return ctx.wizard.next();
  },

  async (ctx) => {
    let session_description;

    if (ctx.message?.text) {
      session_description = ctx.message.text.trim();
    } else if (ctx.callbackQuery?.data === "skip_desc") {
      session_description = null;
      await ctx.deleteMessage().catch(() => {});
      await ctx.answerCbQuery();
    } else if (ctx.callbackQuery?.data === "cancel_session_reg") {
      await ctx.answerCbQuery();
      ctx.wizard.state = {};
      await ctx.reply("❌ ثبت کلاس لغو شد.");
      await ctx.scene.leave();
      const user = await findUserByTelegramId(ctx.chat.id);
      return ctx.telegram.sendMessage(
        ctx.chat.id,
        `${user?.full_name || ""} ${mainMenuMessages.mainText}`,
        mainMenu()
      );
    } else {
      await ctx.reply(
        "لطفا توضیحات را به صورت متن وارد کنید یا از دکمه «توضیحاتی ندارم» استفاده کنید."
      );
      return;
    }

    const { error } = sessionValidationSchema
      .extract("session_description")
      .validate(session_description);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    try {
      const telegram_user_id = ctx.chat.id;
      const user = await findUserByTelegramId(telegram_user_id);
      if (!user?.club_id) {
        throw { userMessage: "شما باشگاهی ثبت نکردید! برای ثبت نام /start" };
      }
      await Session.create({
        club_id: user.club_id,
        name: ctx.wizard.state.session_name,
        description: session_description,
      });

      await ctx.reply(
        "✅ کلاس شما با موفقیت ایجاد شد به منوی اصلی منتقل می شوید."
      );
      await ctx.scene.leave();
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `${user.full_name} ${mainMenuMessages.mainText}`,
        mainMenu()
      );
    } catch (error) {
      return handleError(ctx, error, "ثبت اطلاعات کلاس با مشکل مواجه شد.");
    }
  }
);

sessionRegistration.action("cancel_session_reg", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.wizard.state = {};
  await ctx.reply("❌ ثبت کلاس لغو شد.");
  await ctx.scene.leave();
  const user = await findUserByTelegramId(ctx.chat.id);
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `${user?.full_name || ""} ${mainMenuMessages.mainText}`,
    mainMenu()
  );
});

module.exports = sessionRegistration;
