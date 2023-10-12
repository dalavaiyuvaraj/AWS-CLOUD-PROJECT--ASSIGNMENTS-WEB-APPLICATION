// database.js
const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  //logging:false,
});

module.exports = sequelize;
