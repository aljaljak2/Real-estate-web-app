const Sequelize = require("sequelize");
const sequelize = new Sequelize("wt24", "root", "password", {
host: "127.0.0.1",
dialect: "mysql"
});
module.exports = sequelize;