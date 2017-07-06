const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const parametersList = require('../app/config').parametersList;

const usersSchema = new Schema({
	[parametersList.USER_ID]: String,
	[parametersList.USER_LOGGED_IN]: Boolean,
	[parametersList.MACHINE_HASH]: String,
	[parametersList.TOKEN]: String,
	[parametersList.PAIRS]: Array,
	[parametersList.TEST_ENABLED]: Boolean,
	[parametersList.MARKET_ALERT_ALLOW]: Boolean,
	[parametersList.PUSH]: Array,
	[parametersList.SOCKETS]: Array,
	[parametersList.BROWSERS]: Array,
	[parametersList.MOBILES]: Array
});

module.exports = mongoose.model('Users', usersSchema);
