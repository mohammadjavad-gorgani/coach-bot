const { Session } = require("../../models/session.model");
const { Student } = require("../../models/student.model");
const { findUserByTelegramId } = require("../../services/user.service");
const { mainMenuMessages } = require("../messages/mainMenu.message");
const { handleError } = require("../middlewares/error.handler");

function studentActions(bot) {
    bot.action("add_student_menu", async (ctx) => {
        try {
            await ctx.scene.enter("student-registration");
        } catch (error) {
            handleError(ctx, error, "افزودن هنرجو با مشکل مواجه شد.");
        }
    });
    bot.action("get_students_menu", async (ctx) => {
        try {
            const menuMessageId = ctx.callbackQuery?.message?.message_id;
            await ctx.scene.enter("get-students", { menuMessageId });
        } catch (error) {
            handleError(ctx, error, "نمایش لیست هنرجو با مشکل مواجه شد.");
        }
    });
    bot.action("edit_student_menu", async (ctx) => {
        try {
            await ctx.reply("ویرایش اطلاعات هنرجو");
        } catch (error) {
            handleError(ctx, error, "ویرایش اطلاعات هنرجو با مشکل مواجه شد.");
        }
    });
    bot.action("remove_student_menu", async (ctx) => {
        try {
            await ctx.reply("حذف هنرجو");
        } catch (error) {
            handleError(ctx, error, "حذف هنرجو با مشکل مواجه شد.");
        }
    });
    bot.action("return_main_menu", async (ctx) => {
        try {
            await ctx.deleteMessage();
            const { mainMenu } = require("../menus/main.menu");
            await ctx.telegram.sendMessage(ctx.chat.id, mainMenuMessages.mainText, mainMenu());
        } catch (error) {
            handleError(ctx, error, "بازگشت به منو اصلی با مشکل مواجه شد.");
        }

    });
}

module.exports = {
    studentActions
};