const { validationMapper } = require("../../utils/joi-validation-mapper");

function setupBotErrorHandler(bot) {
    bot.catch(async (err, ctx) => {
        console.error("Unhandled Error:", err);
        try {
            await ctx.reply("مشکلی پیش اومده! لطفا دوباره تلاش کنید.");
        } catch (error) {
            console.error("Failed to send error message:", error);
        }
    });
}

function handleError(ctx, err, userMessage = "خطایی رخ داد!") {
    // if (err?.name == "ValidationError") {
    //     userMessage = err.details[0].message;
    // }
    console.error("Caught Error:", err);
    return ctx.reply(userMessage);
}

module.exports = {
    setupBotErrorHandler,
    handleError
};