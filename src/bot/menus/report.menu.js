const { Markup } = require("telegraf");

function reportMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback("📋 گزارش حضور و غیاب هنرجوها", "report_attendance_list")],
        [Markup.button.callback("💰 گزارش پرداخت شهریه", "report_tuition_payments")],
        [Markup.button.callback("🛍️ گزارش خرید تجهیزات", "report_equipment_purchases")],
        [Markup.button.callback("📊 گزارش کلی هنرجو", "report_student_summary")],
        [Markup.button.callback("🥋 بازگشت به منو اصلی", "return_main_menu")],
    ]);
}

module.exports = {
    reportMenu
};
