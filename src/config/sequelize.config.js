const { config } = require("dotenv");
const { Sequelize } = require("sequelize");
config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};
const sequelize = new Sequelize({
    dialect: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    logging: false
});
sequelize.authenticate().then(() => {
    console.log("connected to mysql db successfully");
}).catch((err) => {
    console.log("cannot connect to database: ", err?.message);
});

module.exports = sequelize