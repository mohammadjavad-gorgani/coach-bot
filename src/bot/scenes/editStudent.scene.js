const { Scenes, Markup } = require("telegraf");
const { Student } = require("../../models/student.model");
const { Session } = require("../../models/session.model");
const { StudentSession } = require("../../models/student-session.model");

const editStudentScene = new Scenes.BaseScene("edit-student");

editStudentScene.enter(async (ctx) => {
  const studentId = ctx.session.editingStudentId;
  const student = await Student.findByPk(studentId, {
    include: [{ model: Session, as: "sessions" }],
  });
  if (!student) {
    await ctx.reply("❌ هنرجو یافت نشد.");
    return ctx.scene.leave();
  }

  ctx.session.editingStudent = student;

  await ctx.reply(
    `✏️ در حال ویرایش ${student.full_name}\nکدام مورد را می‌خواهید تغییر دهید؟`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📛 نام", "edit_name")],
      [Markup.button.callback("📞 شماره تماس", "edit_phone")],
      [Markup.button.callback("🎂 سن", "edit_age")],
      [Markup.button.callback("📆 کلاس‌ها", "edit_sessions")],
      [Markup.button.callback("🔙 بازگشت", "cancel_edit")],
    ])
  );
});

editStudentScene.action("cancel_edit", async (ctx) => {
  await ctx.reply("❌ ویرایش لغو شد.");
  await ctx.scene.leave();
});

editStudentScene.action("edit_name", async (ctx) => {
  ctx.session.editField = "full_name";
  await ctx.reply("📛 نام جدید را وارد کنید:");
});
editStudentScene.action("edit_phone", async (ctx) => {
  ctx.session.editField = "phone_number";
  await ctx.reply("📞 شماره تماس جدید را وارد کنید:");
});
editStudentScene.action("edit_age", async (ctx) => {
  ctx.session.editField = "age";
  await ctx.reply("🎂 سن جدید را وارد کنید:");
});

editStudentScene.on("text", async (ctx) => {
  if (ctx.session.editField && ctx.session.editingStudent) {
    const field = ctx.session.editField;
    const student = ctx.session.editingStudent;
    const value = ctx.message.text.trim();

    try {
      student[field] = field === "age" ? Number(value) : value;
      await student.save();

      ctx.session.editField = null;
      ctx.session.editingStudent = null;
      await ctx.reply("✅ اطلاعات با موفقیت به‌روزرسانی شد.");

      await ctx.scene.leave();
    } catch (error) {
      console.error(error);
      await ctx.reply("⚠️ خطا در ذخیره تغییرات.");
    }
  } else {
    await ctx.reply("لطفاً از دکمه‌ها برای انتخاب فیلد ویرایش استفاده کنید.");
  }
});

editStudentScene.action("edit_sessions", async (ctx) => {
  try {
    const student = ctx.session.editingStudent;
    if (!student) {
      await ctx.reply("❌ هنرجو یافت نشد.");
      return ctx.scene.leave();
    }

    const sessions = await Session.findAll({
      where: { club_id: student.club_id },
      attributes: ["id", "name"],
      raw: true,
    });

    if (!sessions.length) {
      await ctx.reply("⚠️ هیچ کلاسی برای باشگاه شما ثبت نشده است.");
      return;
    }

    const currentSessions = student.sessions.map((s) => s.id);
    ctx.session.selectedSessions = new Set(currentSessions);

    const buttons = sessions.map((s) => [
      Markup.button.callback(
        ctx.session.selectedSessions.has(s.id) ? `✅ ${s.name}` : s.name,
        `toggle_session_${s.id}`
      ),
    ]);

    buttons.push([Markup.button.callback("💾 ذخیره تغییرات", "save_sessions")]);
    buttons.push([Markup.button.callback("❌ لغو", "cancel_edit_sessions")]);

    await ctx.reply("📋 کلاس‌های هنرجو را انتخاب یا لغو کنید:", {
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ خطا در بارگذاری کلاس‌ها.");
  }
});

editStudentScene.action(/toggle_session_(\d+)/, async (ctx) => {
  const id = Number(ctx.match[1]);
  if (!ctx.session.selectedSessions) ctx.session.selectedSessions = new Set();

  if (ctx.session.selectedSessions.has(id)) {
    ctx.session.selectedSessions.delete(id);
  } else {
    ctx.session.selectedSessions.add(id);
  }

  await ctx.answerCbQuery(
    "✅ تغییر موقت اعمال شد (ذخیره نهایی با دکمه پایین)."
  );
});

editStudentScene.action("save_sessions", async (ctx) => {
  try {
    const student = ctx.session.editingStudent;
    const selected = Array.from(ctx.session.selectedSessions);

    await StudentSession.destroy({ where: { student_id: student.id } });

    for (const sessionId of selected) {
      await StudentSession.create({
        student_id: student.id,
        session_id: sessionId,
      });
    }

    ctx.session.selectedSessions = null;
    ctx.session.editingStudent = null;

    await ctx.reply("✅ کلاس‌های هنرجو با موفقیت به‌روزرسانی شدند.");
    await ctx.scene.leave();
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ خطا در ذخیره تغییرات کلاس‌ها.");
  }
});

editStudentScene.action("cancel_edit_sessions", async (ctx) => {
  ctx.session.selectedSessions = null;
  await ctx.reply("❌ ویرایش کلاس لغو شد.");
  await ctx.scene.leave();
});

module.exports = { editStudentScene };
