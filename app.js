const initDatabase = require("./src/config/model.init");

async function main() {
  await initDatabase();
  require("./src/bot/index");
  console.log("run:", "https://web.bale.ai/chat?uid=1583151881");
}
main();
