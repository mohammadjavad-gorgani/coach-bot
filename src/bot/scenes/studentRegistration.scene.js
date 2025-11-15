const { Scenes, Markup } = require("telegraf");
const { findUserByTelegramId } = require("../../services/user.service");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const {
  studentValidationSchema,
} = require("../../validations/studentRegistration.validation");
const { Session } = require("../../models/session.model");
const { Student } = require("../../models/student.model");
const { StudentSession } = require("../../models/student-session.model");
const { handleError } = require("../middlewares/error.handler");

const studentRegistration = new Scenes.WizardScene(
  "student-registration",

  async (ctx) => {
    await ctx.deleteMessage().catch(() => {});
    await ctx.reply("لطفا نام هنرجو خود را وارد کنید: (مثلا 👈 زهرا احمدی)");
    await ctx.reply(
      "در هر زمان می‌توانید عملیات را لغو کنید:",
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ لغو", "cancel_student_reg")],
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const student_name = ctx.message?.text?.trim();
    const { error } = studentValidationSchema
      .extract("student_name")
      .validate(student_name);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.student_name = student_name;
    await ctx.reply("لطفا شماره تماس هنرجو را وارد کنید:");
    await ctx.reply(
      "برای لغو این عملیات کلیک کنید:",
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ لغو", "cancel_student_reg")],
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const student_phone = ctx.message.text?.trim();
    const { error } = studentValidationSchema
      .extract("student_phone")
      .validate(student_phone);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.student_phone = student_phone;
    await ctx.reply("لطفا سن هنرجو را وارد کنید:");
    await ctx.reply(
      "برای لغو این عملیات کلیک کنید:",
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ لغو", "cancel_student_reg")],
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const student_age = Number(ctx.message.text?.trim());
    const { error } = studentValidationSchema
      .extract("student_age")
      .validate(student_age);

    if (error) {
      await ctx.reply(error.message);
      return;
    }

    ctx.wizard.state.student_age = student_age;

    const telegram_user_id = ctx.chat.id;
    const user = await findUserByTelegramId(telegram_user_id);
    const sessions = await Session.findAll({
      where: { club_id: user?.club_id },
      attributes: ["id", "name"],
    });

    if (!sessions.length) {
      ctx.wizard.state.selected_session_ids = [];
      await ctx.reply(
        "فعلاً کلاسی برای انتخاب وجود ندارد. بعداً از بخش ویرایش مشخصات هنرجو می‌توانید کلاس تعیین کنید.",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "🔙 ثبت هنرجو بدون انتخاب کلاس و بازگشت به منوی اصلی",
              "confirm_without_sessions"
            ),
          ],
          [Markup.button.callback("❌ لغو", "cancel_student_reg")],
        ])
      );
      return ctx.wizard.selectStep(5);
    }

    ctx.wizard.state.available_sessions = sessions;

    await ctx.reply("کلاس(های) مورد نظر برای هنرجو را انتخاب کنید:", {
      reply_markup: {
        inline_keyboard: [
          ...sessions.map((s) => [
            { text: s.name, callback_data: `select_session_${s.id}` },
          ]),
          [{ text: "✔️ تایید نهایی", callback_data: "confirm_sessions" }],
          [{ text: "❌ لغو", callback_data: "cancel_student_reg" }],
        ],
      },
    });

    ctx.wizard.state.selected_session_ids = [];
    return ctx.wizard.next();
  },

  async (ctx) => {
    try {
      const data = ctx.callbackQuery?.data;
      if (data?.startsWith("select_session_")) {
        const id = Number(data.replace("select_session_", ""));
        const session = ctx.wizard.state.available_sessions.find(
          (s) => s.id === id
        );
        const exists = ctx.wizard.state.selected_session_ids.includes(id);

        if (!exists) {
          ctx.wizard.state.selected_session_ids.push(id);
        } else {
          ctx.wizard.state.selected_session_ids =
            ctx.wizard.state.selected_session_ids.filter((sid) => sid !== id);
        }

        const actionText = !exists
          ? `✅ به کلاس "${session.name}" اضافه شد.`
          : `❌ از کلاس "${session.name}" حذف شد.`;

        if (!ctx.wizard.state.statusMessageId) {
          const statusMsg = await ctx.reply(actionText);
          ctx.wizard.state.statusMessageId = statusMsg.message_id;
        } else {
          await ctx.telegram
            .editMessageText(
              ctx.chat.id,
              ctx.wizard.state.statusMessageId,
              null,
              actionText
            )
            .catch(() => {});
        }

        await ctx.answerCbQuery();
      } else if (data === "confirm_sessions") {
        await ctx.deleteMessage().catch(() => {});
        await ctx.answerCbQuery();

        if (ctx.wizard.state.statusMessageId) {
          await ctx.telegram
            .deleteMessage(ctx.chat.id, ctx.wizard.state.statusMessageId)
            .catch(() => {});
        }

        if (ctx.wizard.state.selected_session_ids.length === 0) {
          await ctx.reply(
            "فعلاً کلاسی انتخاب نکردید. بعداً از بخش ویرایش مشخصات هنرجو می‌توانید کلاس تعیین کنید، بنویس «حله» تا یادت بمونه 😊."
          );
          return ctx.wizard.next();
        } else {
          await ctx.reply("✅ کلاس‌ها انتخاب شدند. در حال ثبت هنرجو...");
        }
        ctx.wizard.selectStep(ctx.wizard.cursor + 1);
        return ctx.wizard.steps[ctx.wizard.cursor](ctx);
      } else if (data === "cancel_student_reg") {
        await ctx.answerCbQuery();
        ctx.wizard.state = {};
        await ctx.reply("❌ ثبت هنرجو لغو شد.");
        await ctx.scene.leave();
        const user = await findUserByTelegramId(ctx.chat.id);
        return ctx.telegram.sendMessage(
          ctx.chat.id,
          `${user?.full_name || ""} ${mainMenuMessages.mainText}`,
          mainMenu()
        );
      } else {
        return await ctx.reply("لطفا از گزینه های بالا انتخاب کنید 🙏");
      }
    } catch (error) {
      return handleError(ctx, error, "خطا در انتخاب کلاس‌ها.");
    }
  },

  async (ctx) => {
    try {
      const telegram_user_id = ctx.chat.id;
      const user = await findUserByTelegramId(telegram_user_id);
      const student = await Student.create({
        full_name: ctx.wizard.state.student_name,
        phone_number: ctx.wizard.state.student_phone,
        age: ctx.wizard.state.student_age,
        club_id: user?.club_id,
      });

      const sessionIds = ctx.wizard.state.selected_session_ids || [];
      for (const sid of sessionIds) {
        await StudentSession.create({
          student_id: student.id,
          session_id: sid,
        });
      }

      await ctx.reply("✅ هنرجو با موفقیت ثبت شد.");
      await ctx.scene.leave();
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `${user.full_name} ${mainMenuMessages.mainText}`,
        mainMenu()
      );
    } catch (error) {
      return handleError(ctx, error, "ثبت هنرجو با مشکل مواجه شد.");
    }
  }
);

studentRegistration.action("cancel_student_reg", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.wizard.state = {};
  await ctx.reply("❌ ثبت هنرجو لغو شد.");
  await ctx.scene.leave();
  const user = await findUserByTelegramId(ctx.chat.id);
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `${user?.full_name || ""} ${mainMenuMessages.mainText}`,
    mainMenu()
  );
});

module.exports = studentRegistration;
