const { Scenes, Markup } = require("telegraf");
const { Student } = require("../../models/student.model");
const { Payment } = require("../../models/payment.model");
const { mainMenu } = require("../menus/main.menu");
const { mainMenuMessages } = require("../messages/mainMenu.message");

const paymentScene = new Scenes.BaseScene("payment-scene");

paymentScene.enter(async (ctx) => {
  const clubId = ctx.session.user.club_id;
  const students = await Student.findAll({ where: { club_id: clubId } });

  if (students.length === 0) {
    return ctx.reply("هیچ هنرجویی ثبت نشده است.");
  }

  const buttons = students.map((s) => [
    Markup.button.callback(s.full_name, `select_student_${s.id}`),
  ]);
  buttons.push([Markup.button.callback("❌ لغو پرداخت", "cancel_payment")]);

  await ctx.reply(
    "انتخاب هنرجو برای ثبت پرداخت:",
    Markup.inlineKeyboard(buttons)
  );
});

paymentScene.action(/select_student_(\d+)/, async (ctx) => {
  const studentId = ctx.match[1];
  const student = await Student.findByPk(studentId);

  ctx.session.payment = {
    student_id: studentId,
    student_name: student.full_name,
  };

  await ctx.reply(
    "نوع پرداخت را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 شهریه", "payment_type_fee")],
      [Markup.button.callback("🎽 تجهیزات", "payment_type_equipment")],
      [Markup.button.callback("❌ لغو پرداخت", "cancel_payment")],
    ])
  );
});

paymentScene.action(
  ["payment_type_fee", "payment_type_equipment"],
  async (ctx) => {
    ctx.session.payment.payment_type =
      ctx.match.input === "payment_type_fee" ? "شهریه" : "تجهیزات";

    if (ctx.session.payment.payment_type === "شهریه") {
      await ctx.reply("برای چه ماهی است؟ (مثلاً آبان ۱۴۰۳)");
    } else {
      await ctx.reply("توضیح خرید را وارد کنید (مثلاً کفش یا دستکش):");
    }

    ctx.session.state = "awaiting_extra_info";
    await ctx.reply(
      "در هر زمان می‌توانید عملیات را لغو کنید:",
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ لغو پرداخت", "cancel_payment")],
      ])
    );
  }
);

paymentScene.on("text", async (ctx) => {
  const state = ctx.session.state;

  if (state === "awaiting_extra_info") {
    if (ctx.session.payment.payment_type === "شهریه") {
      ctx.session.payment.month = ctx.message.text;
    } else {
      ctx.session.payment.description = ctx.message.text;
    }
    ctx.session.state = "awaiting_amount";
    return ctx.reply("مبلغ پرداخت (به تومان) را وارد کنید:");
  }

  if (state === "awaiting_amount") {
    const amount = parseFloat(ctx.message.text);
    if (isNaN(amount)) return ctx.reply("مقدار عددی وارد کنید:");
    ctx.session.payment.amount = amount;
    ctx.session.state = "confirm_payment";

    const summary = `
🔹 هنرجو: ${ctx.session.payment.student_name}
🔸 نوع پرداخت: ${ctx.session.payment.payment_type}
💵 مبلغ: ${ctx.session.payment.amount.toLocaleString()} تومان
${ctx.session.payment.month ? `📅 ماه: ${ctx.session.payment.month}` : ""}
${
  ctx.session.payment.description
    ? `📝 توضیح: ${ctx.session.payment.description}`
    : ""
}
        `;
    return ctx.reply(
      `آیا اطلاعات زیر تأیید می‌شود؟\n${summary}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ تأیید", "confirm_payment_yes")],
        [Markup.button.callback("❌ لغو", "confirm_payment_no")],
      ])
    );
  }
});

paymentScene.action("confirm_payment_yes", async (ctx) => {
  const { student_id, payment_type, amount, month, description } =
    ctx.session.payment;
  const user = ctx.session.user;

  await Payment.create({
    student_id,
    club_id: user.club_id,
    user_id: user.id,
    payment_type,
    amount,
    month,
    description,
    payment_date: new Date(),
  });

  ctx.session.payment = null;
  ctx.session.state = null;
  await ctx.reply("✅ پرداخت با موفقیت ثبت شد.");

  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `${user.full_name} ${mainMenuMessages.mainText}`,
    mainMenu()
  );

  await ctx.scene.leave();
});

paymentScene.action("confirm_payment_no", async (ctx) => {
  const user = ctx.session.user;
  ctx.session.payment = null;
  ctx.session.state = null;
  await ctx.reply("❌ عملیات لغو شد.");
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `${user.full_name} ${mainMenuMessages.mainText}`,
    mainMenu()
  );
  await ctx.scene.leave();
});

paymentScene.action("cancel_payment", async (ctx) => {
  const user = ctx.session.user;
  ctx.session.payment = null;
  ctx.session.state = null;
  await ctx.answerCbQuery();
  await ctx.reply("❌ عملیات ثبت پرداخت لغو شد.");
  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `${user.full_name} ${mainMenuMessages.mainText}`,
    mainMenu()
  );
  await ctx.scene.leave();
});

module.exports = { paymentScene };
