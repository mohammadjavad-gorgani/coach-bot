const { WizardScene } = require("telegraf/scenes");
const { findUserByTelegramId } = require("../../services/user.service");
const { Student } = require("../../models/student.model");
const { Session } = require("../../models/session.model");
const {
  studentValidationSchema,
} = require("../../validations/studentRegistration.validation");
const { StudentSession } = require("../../models/student-session.model");
const { Markup } = require("telegraf");

const getStudents = new WizardScene(
  "get-students",

  async (ctx) => {
    const user = await findUserByTelegramId(ctx?.chat?.id);
    if (!user) {
      return await ctx.reply(
        "کاربر پیدا نشد! لطفا ربات را دوباره استارت کنید و اقدام به ثبت نام کنید."
      );
    }
    if (!user.club_id) {
      return await ctx.reply(
        "باشگاهی برای شما وجود ندارد! لطفا ابتدا باشگاه خود را ثبت کنید."
      );
    }
    const students = await Student.findAll({
      where: { club_id: user.club_id },
      attributes: ["id", "full_name"],
      include: [{ model: Session, as: "sessions" }],
    });

    if (!students.length) {
      await ctx.reply("هیچ هنرجویی برای باشگاه شما ثبت نشده است.");
      await ctx.scene.leave();
      return;
    } else {
      const message = students
        .map((student, index) => {
          const { sessions } = student;
          return `${index + 1} - ${student.full_name}\n📆 کلاس‌ها: ${
            sessions.map((session) => session.name).join(" و ") || "عضو نیست"
          }`;
        })
        .join("\n");
      await ctx.reply(message);
      await ctx.reply(
        "برای دیدن جزئیات، ویرایش یا حذف هنرجو نام او را ارسال کنید.\n(برای خروج بنویسید «خروج»)"
      );
      return ctx.wizard.next();
    }
  },

  async (ctx) => {
    const user = await findUserByTelegramId(ctx?.chat?.id);
    const full_name = ctx?.message?.text.trim();

    if (full_name === "خروج") {
      ctx.wizard.selectStep(ctx.wizard.cursor + 1);
      return await ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } else if (full_name === undefined) {
      return await ctx.reply("لطفاً نام هنرجو را وارد کنید یا «خروج» بنویسید.");
    }

    const { error } = studentValidationSchema
      .extract("student_name")
      .validate(full_name);
    if (error) return await ctx.reply(error.message);

    if (full_name && typeof full_name === "string") {
      const students = await Student.findAll({
        where: { club_id: user?.club_id, full_name },
        attributes: ["id", "full_name", "phone_number", "age"],
        include: [{ model: Session, as: "sessions" }],
      });
      if (!students.length)
        return await ctx.reply("هیچ هنرجویی با این نام پیدا نشد.");
      for (const student of students) {
        const { sessions } = student;
        await ctx.reply(
          `👤 ${student?.full_name}\n📞 ${student?.phone_number}\n🎂 سن: ${
            student?.age
          }\n📆 کلاس‌ها: ${
            sessions.map((session) => session.name).join(" و ") || "عضو نیست"
          }`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✏️ ویرایش",
                    callback_data: `edit_student_${student?.id}`,
                  },
                  {
                    text: "🗑️ حذف",
                    callback_data: `delete_student_${student?.id}`,
                  },
                ],
              ],
            },
          }
        );
      }
    }
    await ctx.reply("می‌توانید دوباره جستجو کنید یا «خروج» بنویسید.");
    await ctx.wizard.next();
  },

  async (ctx) => {
    if (ctx?.message?.text?.trim() === "خروج") {
      await ctx.reply(
        "لطفا از طریق بخش بازگشت به منو اصلی در آخرین منو به صفحه اصلی برگرید.",
        {
          reply_to_message_id: ctx?.wizard?.state?.menuMessageId,
        }
      );
      await ctx.scene.leave();
    } else {
      ctx.wizard.selectStep(ctx.wizard.cursor - 1);
      return await ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }
);

getStudents.action(/delete_student_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const studentId = Number(ctx.match[1]);
    const student = await Student.findByPk(studentId);
    if (!student) return ctx.reply("❌ هنرجو یافت نشد.");

    await ctx.reply(
      `آیا مطمئن هستید که می‌خواهید ${student.full_name} را حذف کنید؟`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "✅ بله، حذف شود",
            `confirm_delete_${student.id}`
          ),
        ],
        [Markup.button.callback("❌ خیر، بازگشت", "cancel_delete")],
      ])
    );
  } catch (error) {
    console.error(error);
    ctx.reply("⚠️ خطا در حذف هنرجو.");
  }
});

getStudents.action(/confirm_delete_(\d+)/, async (ctx) => {
  try {
    const studentId = Number(ctx.match[1]);
    await StudentSession.destroy({ where: { student_id: studentId } });
    await Student.destroy({ where: { id: studentId } });
    await ctx.editMessageText("✅ هنرجو با موفقیت حذف شد.");
  } catch (error) {
    console.error(error);
    ctx.reply("⚠️ خطا در انجام حذف.");
  }
});

getStudents.action("cancel_delete", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("❌ عملیات حذف لغو شد.");
});

getStudents.action(/edit_student_(\d+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const studentId = Number(ctx.match[1]);
  ctx.session.editingStudentId = studentId;
  await ctx.scene.enter("edit-student");
});

module.exports = getStudents;
