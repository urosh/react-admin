"use strict";
const parameters = require('../parameters');

module.exports = function(webeyezRedis, usersManagement){
	webeyezRedis.addRedisInEvent('UserSettingsChanged', 
		[],
		function(data) {
			console.log('We received event from webeyezRedis');
		} 
	)
	return {};
}