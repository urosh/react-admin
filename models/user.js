const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const parameters = require('../app/parameters');

const usersSchema = new Schema({
	[parameters.user.USER_ID]: String,
	[parameters.user.USER_LOGGED_IN]: Boolean,
	[parameters.user.MACHINE_HASH]: String,
	[parameters.user.TOKEN]: String,
	[parameters.user.PAIRS]: Array,
	[parameters.user.TEST_ENABLED]: Boolean,
	[parameters.user.MARKET_ALERT_ALLOW]: Boolean,
	[parameters.messageChannels.PUSH]: Array,
	[parameters.messageChannels.SOCKETS]: Array,
	[parameters.messageChannels.BROWSERS]: Array,
	[parameters.messageChannels.MOBILES]: Array
});

module.exports = mongoose.model('Users', usersSchema);
