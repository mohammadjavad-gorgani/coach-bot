const { WizardScene } = require("telegraf/scenes");
const { Attendance } = require("../../models/attendance.model");
const { Student } = require("../../models/student.model");
const sequelize = require("../../config/sequelize.config");
const {
  studentValidationSchema,
} = require("../../validations/studentRegistration.validation");
const { Op } = require("sequelize");
const moment = require("jalali-moment");
const { StudentSession } = require("../../models/student-session.model");
const { Session } = require("../../models/session.model");

const reportAttendanceScene = new WizardScene(
  "reportAttendance-scene",

  async (ctx) => {
    const sessionId = ctx.session.selectedSessionId;
    if (!sessionId) return ctx.scene.leave();

    const session = await Session.findByPk(sessionId, { attributes: ["name"] });

    const studentAttendances = await Student.findAll({
      include: [
        {
          model: StudentSession,
          as: "studentSessions",
          where: {
            session_id: sessionId,
          },
          attributes: [],
        },
        {
          model: Attendance,
          as: "attendances",
          where: {
            session_id: sessionId,
            status: "غایب",
          },
          required: false,
          attributes: [],
        },
      ],
      attributes: [
        "full_name",
        "id",
        [
          sequelize.fn("COUNT", sequelize.col("attendances.id")),
          "absence_count",
        ],
      ],
      group: ["Student.id", "full_name"],
      order: [[sequelize.literal("absence_count"), "DESC"]],
      raw: true,
    });

    if (!studentAttendances.length)
      return await ctx.reply("برای این کلاس حضور و غیابی ثبت نشده است.");

    const over3 = studentAttendances.filter((s) => s.absence_count > 3);
    const underOrEqual3 = studentAttendances.filter(
      (s) => s.absence_count <= 3
    );

    const listToMessage = (list) =>
      list
        .map(
          (s, i) =>
            `${i + 1}. ${s.full_name} - غیبت‌ها: ${s.absence_count || 0}`
        )
        .join("\n");

    let msg = `📚 گزارش غیبت کلاس: *${session?.name || "نامشخص"}*\n\n`;

    if (over3.length)
      msg +=
        "❗ هنرجویان با بیش از ۳ غیبت:\n" +
        listToMessage(over3) +
        "\n\n🟰🟰🟰\n\n";

    msg += "بقیه هنرجویان:\n" + listToMessage(underOrEqual3);

    await ctx.reply(msg, { parse_mode: "Markdown" });

    await ctx.reply(
      "لطفا برای دیدن جزئیات، *نام هنرجو* را ارسال کنید یا کلمه «خروج» را بفرستید.",
      {
        parse_mode: "Markdown",
      }
    );

    return ctx.wizard.next();
  },

  async (ctx) => {
    const full_name = ctx?.message?.text.trim();
    if (!full_name)
      return await ctx.reply("لطفا یک نام وارد کنید یا «خروج» را بفرستید.");
    if (full_name === "خروج") {
      ctx.wizard.selectStep(ctx.wizard.cursor + 1);
      return await ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }

    const { error } = studentValidationSchema
      .extract("student_name")
      .validate(full_name);
    if (error) return await ctx.reply(error.message);

    const absenceDates = await Attendance.findAll({
      where: {
        session_id: ctx?.session?.selectedSessionId,
        status: "غایب",
      },
      include: [
        {
          model: Student,
          as: "student",
          where: {
            full_name: {
              [Op.like]: `%${full_name}%`,
            },
          },
          attributes: [],
          required: true,
        },
      ],
      attributes: ["date"],
      raw: true,
      nest: true,
    });

    if (!absenceDates.length)
      return await ctx.reply(
        "این هنرجو وجود ندارد یا غیبتی برای او ثبت نشده است."
      );

    moment.locale("fa", { useGregorianParser: true });
    let absenceReportMsg = `📋 جزئیات\n${full_name} در جلسات زیر غایب بوده است:\n`;

    const rMsg =
      `📋 جزئیات غیبت ${full_name}:\n\n` +
      absenceDates
        .map((d) => `🗓️ ${moment(d.date).format("dddd YYYY/MM/DD")}`)
        .join("\n");

    await ctx.reply(rMsg);
    await ctx.reply(
      "برای مشاهده هنرجوی دیگر، نام را ارسال کنید یا «خروج» را بفرستید."
    );

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

module.exports = reportAttendanceScene;
