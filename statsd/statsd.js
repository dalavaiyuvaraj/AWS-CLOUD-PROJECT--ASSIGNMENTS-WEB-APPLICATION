const statsd = require('node-statsd');

//StatsD
const statsdClient = new statsd({
    host: 'localhost',
    port: 8125
  });

  module.exports = statsdClient;