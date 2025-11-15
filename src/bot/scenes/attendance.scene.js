const { Scenes, Markup } = require("telegraf");
const { StudentSession } = require("../../models/student-session.model");
const { Student } = require("../../models/student.model");
const { Attendance } = require("../../models/attendance.model");
const sequelize = require("../../config/sequelize.config");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const { mainMenu } = require("../menus/main.menu");

const generateAttendanceList = (students, presentIds, absences, offset = 0) => {
  return (
    "📋 لیست حضور و غیاب کلاس:\n" +
    students
      .map((s, i) => {
        const mark = presentIds.includes(s.id) ? "✅" : "❌";
        return `${i + 1 + offset}. ${s.name} ${mark} غیبت ها: ${
          absences.find((obj) => obj.student_id === s.id)?.absence_count ?? 0
        }`;
      })
      .join("\n") +
    "\n\n✔️ تایید نهایی"
  );
};

async function renderCurrentPage(ctx) {
  const sessionId = ctx.session.selectedSessionId;
  const page = ctx.wizard.state.page || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { rows: studentSessions, count } = await StudentSession.findAndCountAll(
    {
      where: { session_id: sessionId },
      include: { model: Student, as: "students" },
      limit,
      offset,
    }
  );

  if (count === 0) {
    await ctx.reply("هیچ هنرجویی برای این کلاس ثبت نشده است.");

    await ctx.scene.leave();
    return;
  }
  const students = studentSessions.map((s) => ({
    id: s.students.id,
    name: s.students.full_name,
  }));

  ctx.wizard.state.studentList = students;
  ctx.wizard.state.allStudents = ctx.wizard.state.allStudents || [];
  ctx.wizard.state.allStudents.push(...students);
  const uniqueAllStudents = [
    ...new Map(ctx.wizard.state.allStudents.map((s) => [s.id, s])).values(),
  ];
  ctx.wizard.state.allStudents = uniqueAllStudents;
  ctx.wizard.state.totalPage = Math.ceil(count / limit);

  if (ctx.wizard.state.totalPage === 1) {
    await ctx.reply(
      generateAttendanceList(
        students,
        ctx.wizard.state.attendance.presentIds,
        ctx.wizard.state.absences,
        offset
      ),
      {
        reply_markup: {
          inline_keyboard: [
            ...students.map((s) => [
              { text: s.name, callback_data: `toggle_present_${s.id}` },
            ]),
            [{ text: "✔️ تایید نهایی", callback_data: "confirm_attendance" }],
            [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
          ],
        },
      }
    );
  } else if (page === 1) {
    await ctx.reply(
      generateAttendanceList(
        students,
        ctx.wizard.state.attendance.presentIds,
        ctx.wizard.state.absences,
        offset
      ),
      {
        reply_markup: {
          inline_keyboard: [
            ...students.map((s) => [
              { text: s.name, callback_data: `toggle_present_${s.id}` },
            ]),
            [{ text: "⬅️ صفحه بعد", callback_data: "next_page" }],
            [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
          ],
        },
      }
    );
  } else if (page === ctx.wizard.state.totalPage) {
    await ctx.reply(
      generateAttendanceList(
        students,
        ctx.wizard.state.attendance.presentIds,
        ctx.wizard.state.absences,
        offset
      ),
      {
        reply_markup: {
          inline_keyboard: [
            ...students.map((s) => [
              { text: s.name, callback_data: `toggle_present_${s.id}` },
            ]),
            [{ text: "➡️ صفحه قبل", callback_data: "previous_page" }],
            [{ text: "✔️ تایید نهایی", callback_data: "confirm_attendance" }],
            [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
          ],
        },
      }
    );
  } else {
    await ctx.reply(
      generateAttendanceList(
        students,
        ctx.wizard.state.attendance.presentIds,
        ctx.wizard.state.absences,
        offset
      ),
      {
        reply_markup: {
          inline_keyboard: [
            ...students.map((s) => [
              { text: s.name, callback_data: `toggle_present_${s.id}` },
            ]),
            [
              { text: "➡️ صفحه قبل", callback_data: "previous_page" },
              { text: "⬅️ صفحه بعد", callback_data: "next_page" },
            ],
            [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
          ],
        },
      }
    );
  }
}

const attendanceScene = new Scenes.WizardScene(
  "attendance-scene",

  async (ctx) => {
    const sessionId = ctx.session.selectedSessionId;
    if (!sessionId) return ctx.scene.leave();

    ctx.wizard.state.attendance = {
      sessionId,
      presentIds: [],
    };

    const absences = await Attendance.findAll({
      where: {
        session_id: sessionId,
        status: "غایب",
      },
      attributes: [
        "student_id",
        [sequelize.fn("COUNT", sequelize.col("student_id")), "absence_count"],
      ],
      group: ["student_id"],
      raw: true,
    });

    ctx.wizard.state.absences = absences;

    ctx.wizard.state.page = 1;
    await renderCurrentPage(ctx);
    ctx.wizard.next();
  },

  async (ctx) => {
    const data = ctx.callbackQuery?.data;
    const state = ctx.wizard.state.attendance;
    const page = ctx.wizard.state.page;
    const studentList = ctx.wizard.state.studentList;
    const presentIds = state.presentIds;

    if (data?.startsWith("toggle_present_")) {
      const studentId = Number(data.replace("toggle_present_", ""));
      const isPresent = presentIds.includes(studentId);

      if (isPresent)
        state.presentIds = state.presentIds.filter((id) => id !== studentId);
      else state.presentIds.push(studentId);

      if (ctx.wizard.state.totalPage === 1) {
        await ctx.editMessageText(
          generateAttendanceList(
            studentList,
            ctx.wizard.state.attendance.presentIds,
            ctx.wizard.state.absences,
            (page - 1) * 10
          ),
          {
            reply_markup: {
              inline_keyboard: [
                ...studentList.map((s) => [
                  { text: s.name, callback_data: `toggle_present_${s.id}` },
                ]),
                [
                  {
                    text: "✔️ تایید نهایی",
                    callback_data: "confirm_attendance",
                  },
                ],
                [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
              ],
            },
          }
        );
      } else if (page === 1) {
        await ctx.editMessageText(
          generateAttendanceList(
            studentList,
            ctx.wizard.state.attendance.presentIds,
            ctx.wizard.state.absences,
            (page - 1) * 10
          ),
          {
            reply_markup: {
              inline_keyboard: [
                ...studentList.map((s) => [
                  { text: s.name, callback_data: `toggle_present_${s.id}` },
                ]),
                [{ text: "⬅️ صفحه بعد", callback_data: "next_page" }],
                [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
              ],
            },
          }
        );
      } else if (page === ctx.wizard.state.totalPage) {
        await ctx.editMessageText(
          generateAttendanceList(
            studentList,
            ctx.wizard.state.attendance.presentIds,
            ctx.wizard.state.absences,
            (page - 1) * 10
          ),
          {
            reply_markup: {
              inline_keyboard: [
                ...studentList.map((s) => [
                  { text: s.name, callback_data: `toggle_present_${s.id}` },
                ]),
                [{ text: "➡️ صفحه قبل", callback_data: "previous_page" }],
                [
                  {
                    text: "✔️ تایید نهایی",
                    callback_data: "confirm_attendance",
                  },
                ],
                [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
              ],
            },
          }
        );
      } else {
        await ctx.editMessageText(
          generateAttendanceList(
            studentList,
            ctx.wizard.state.attendance.presentIds,
            ctx.wizard.state.absences,
            (page - 1) * 10
          ),
          {
            reply_markup: {
              inline_keyboard: [
                ...studentList.map((s) => [
                  { text: s.name, callback_data: `toggle_present_${s.id}` },
                ]),
                [
                  { text: "➡️ صفحه قبل", callback_data: "previous_page" },
                  { text: "⬅️ صفحه بعد", callback_data: "next_page" },
                ],
                [{ text: "❌ لغو", callback_data: "cancel_attendance" }],
              ],
            },
          }
        );
      }

      await ctx.answerCbQuery(
        `${studentList.find((s) => s.id === studentId)?.name} ${
          isPresent ? "غایب شد" : "حاضر شد"
        }`
      );
      return;
    }

    if (data === "confirm_attendance") {
      for (const stu of ctx.wizard.state.allStudents) {
        await Attendance.create({
          student_id: stu.id,
          session_id: state.sessionId,
          status: presentIds.includes(stu.id) ? "حاضر" : "غایب",
        });
      }

      await ctx.editMessageText("✅ حضور و غیاب با موفقیت ثبت شد.");
      return ctx.scene.leave();
    }

    if (data === "next_page") {
      const totalPage = ctx.wizard.state.totalPage;
      ctx.wizard.state.page++;
      if (ctx.wizard.state.page > totalPage) ctx.wizard.state.page = totalPage;
      await ctx.deleteMessage().catch(() => {});
      await renderCurrentPage(ctx);
      return;
    }

    if (data === "previous_page") {
      const totalPage = ctx.wizard.state.totalPage;
      ctx.wizard.state.page--;
      if (ctx.wizard.state.page < 1) ctx.wizard.state.page = 1;
      await ctx.deleteMessage().catch(() => {});
      await renderCurrentPage(ctx);
      return;
    }

    if (data === "cancel_attendance") {
      await ctx.answerCbQuery();
      await ctx.reply("❌ عملیات حضور و غیاب لغو شد.");
      await ctx.scene.leave();
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        mainMenuMessages.mainText,
        mainMenu()
      );
      return;
    }

    return await ctx.reply("از دکمه‌های مشخص‌ شده استفاده کنید.");
  }
);

module.exports = attendanceScene;
