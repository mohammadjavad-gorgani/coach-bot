const { Markup } = require("telegraf");

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback("📋 مدیریت هنرجوها", "student_menu")],
        [Markup.button.callback("📆 مدیریت جلسات", "session_menu")],
        [Markup.button.callback("✅ حضور و غیاب", "attendance_menu")],
        [Markup.button.callback("💳 پرداختی‌ها", "payment_menu")],
        [Markup.button.callback("📊 گزارش‌ها", "report_menu")]
    ]);
}

module.exports = {
    mainMenu
};