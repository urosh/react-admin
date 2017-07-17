"use strict";
const parameters = require('../parameters');

module.exports = function(webeyezRedis, usersManagement){
	webeyezRedis.addEvent('UserSettingsChanged', 
		parameters.messageChannels.REDIS, 
		[],
		function(data) {
			console.log('We received event from webeyezRedis');
		} 
	)
	return {};
}