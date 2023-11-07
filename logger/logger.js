const app = require("../index");
const winston = require('winston');
const path = require('path');

//Winston Logger
const logsFolder = path.join(__dirname, '../logs');
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsFolder, 'csye6225.log') })
  ]
});

module.exports = logger;