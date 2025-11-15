const { Markup } = require("telegraf");

function studentMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("➕ افزودن هنرجو", "add_student_menu")],
    [Markup.button.callback("🔍 هنرجویان", "get_students_menu")],
    [Markup.button.callback("🥋 بازگشت به منو اصلی", "return_main_menu")],
  ]);
}

module.exports = {
  studentMenu,
};
