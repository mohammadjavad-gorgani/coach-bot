const { Markup } = require("telegraf");

function sessionMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("➕ تعریف کلاس جدید", "add_session_menu")],
    [Markup.button.callback("📖 کلاس ها", "get_sessions_menu")],
    [Markup.button.callback("🥋 بازگشت به منو اصلی", "return_main_menu")],
  ]);
}

module.exports = {
  sessionMenu,
};
