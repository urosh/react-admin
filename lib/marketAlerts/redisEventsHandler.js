"use strict";

const Redis = require('ioredis');
const config = require('./config');
/*var logger = require('../general/logger');
var generalErrorLogger = logger.generalLogger;
*/
const globalAlerts = config.globalAlerts;

