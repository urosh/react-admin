"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports = function(webeyezRedis, usersManagement){
	webeyezRedis.addEvent('UserSettingsChanged', 
		config.eventChannels.REDIS, 
		[],
		function(data) {
			console.log('We received event from webeyezRedis');
		} 
	)
	return {};
}