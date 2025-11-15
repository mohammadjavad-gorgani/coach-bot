const { Scenes } = require("telegraf");
const { findUserByTelegramId } = require("../../services/user.service");
const { Club } = require("../../models/club.model");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const {
  clubValidationSchema,
} = require("../../validations/clubRegistration.validation");
const { handleError } = require("../middlewares/error.handler");

const clubRegistration = new Scenes.WizardScene(
  "club-registration",

  async (ctx) => {
    await ctx.reply("لطفا نام باشگاه خود را وارد کنید:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const club_name = ctx.message.text?.trim();
    const { error } = clubValidationSchema
      .extract("club_name")
      .validate(club_name);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.club_name = club_name;
    await ctx.reply("لطفا آدرس باشگاه خود را وارد کنید:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const club_address = ctx.message.text?.trim();
    const { error } = clubValidationSchema
      .extract("club_address")
      .validate(club_address);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.club_address = club_address;
    await ctx.reply("لطفا شماره تماس باشگاه خود را وارد کنید:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const club_phone = ctx.message.text?.trim();
    const { error } = clubValidationSchema
      .extract("club_phone")
      .validate(club_phone);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    try {
      const telegram_user_id = ctx.chat.id;
      const user = await findUserByTelegramId(telegram_user_id);
      const club = await Club.create({
        user_id: user.id,
        name: ctx.wizard.state.club_name,
        address: ctx.wizard.state.club_address,
        phone: club_phone,
      });
      await user.update({ club_id: club.id });
      await ctx.reply("✅ باشگاه شما ثبت شد حال به منوی خدمات منتقل می شوید.");
      await ctx.scene.leave();
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `${user.full_name} ${mainMenuMessages.mainText}`,
        mainMenu()
      );
    } catch (error) {
      return handleError(ctx, err, "ثبت اطلاعات باشگاه با مشکل مواجه شد.");
    }
  }
);

module.exports = clubRegistration;
