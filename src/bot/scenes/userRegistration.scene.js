const { Scenes } = require("telegraf");
const { User } = require("../../models/user.model");
const {
  userValidationSchema,
} = require("../../validations/userRegistration.validation");

const userRegistration = new Scenes.WizardScene(
  "user-registration",

  async (ctx) => {
    await ctx.reply("لطفا نام کامل خود را وارد کنید:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const full_name = ctx.message.text?.trim();
    const { error } = userValidationSchema
      .extract("full_name")
      .validate(full_name);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.full_name = full_name;
    await ctx.reply("لطفاً شماره موبایل خود را وارد کنید:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const phone_number = ctx.message.text?.trim();
    const { error } = userValidationSchema
      .extract("phone_number")
      .validate(phone_number);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    try {
      const telegram_user_id = ctx.chat.id;
      await User.create({
        telegram_user_id,
        full_name: ctx.wizard.state.full_name,
        phone_number,
      });

      await ctx.reply("✅ ثبت‌نام با موفقیت انجام شد.");
      return ctx.scene.enter("club-registration");
    } catch (error) {
      return handleError(ctx, error, "ثبت اطلاعات کاربر با مشکل مواجه شد.");
    }
  }
);

module.exports = userRegistration;
