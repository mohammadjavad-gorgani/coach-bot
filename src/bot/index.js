const { config } = require("dotenv");
const { Telegraf, session, Scenes } = require("telegraf");
const { findUserByTelegramId } = require("../services/user.service");
const userRegistration = require("./scenes/userRegistration.scene");
const clubRegistration = require("./scenes/clubRegistration.scene");
const { mainMenu } = require("./menus/main.menu");
const { mainMenuMessages } = require("./messages/mainMenu.message");
const { mainActions } = require("./actions/main.action");
const { studentActions } = require("./actions/student.action");
const {
  setupBotErrorHandler,
  handleError,
} = require("./middlewares/error.handler");
const { sessionAction } = require("./actions/session.action");
const sessionRegistration = require("./scenes/sessionRegistration.scene");
const studentRegistration = require("./scenes/studentRegistration.scene");
const getStudents = require("./scenes/getStudents.scene");
const attendanceScene = require("./scenes/attendance.scene");
const { reportAction } = require("./actions/report.action");
const reportAttendanceScene = require("./scenes/reportAttendance.scene");
const { paymentScene } = require("./scenes/payment.scene");
const { editStudentScene } = require("./scenes/editStudent.scene");
const { sessionListScene } = require("./scenes/sessionList.scene");
const { editSessionScene } = require("./scenes/editSession.scene");
config();
const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://tapi.bale.ai/bot",
  },
});

const stage = new Scenes.Stage([
  userRegistration,
  clubRegistration,
  sessionRegistration,
  studentRegistration,
  getStudents,
  attendanceScene,
  reportAttendanceScene,
  paymentScene,
  editStudentScene,
  sessionListScene,
  editSessionScene,
]);
bot.use(session());
bot.use(stage.middleware());

bot.help((ctx) => {
  ctx.reply("کمک");
});

bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.chat.id);
    const user = await findUserByTelegramId(telegramId);
    if (!user) {
      await ctx.scene.enter("user-registration");
    } else {
      if (!user.club_id) {
        await ctx.scene.enter("club-registration");
      } else {
        ctx.session.user = user;
        await ctx.telegram.sendMessage(
          ctx.chat.id,
          `${user.full_name} ${mainMenuMessages.mainText}`,
          mainMenu()
        );
      }
    }
  } catch (error) {
    handleError(ctx, error, "شروع ربات با مشکل مواجه شد.");
  }
});

mainActions(bot);
studentActions(bot);
sessionAction(bot);
reportAction(bot);

setupBotErrorHandler(bot);

bot.launch();
