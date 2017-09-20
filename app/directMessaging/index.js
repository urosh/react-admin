"use strict";

module.exports = function(directMessaging, usersManagement){
	
	let adminManagement = require('./adminManagement')();
	require('./adminAuthentication')(directMessaging);
	require('./adminSocketConnections')(directMessaging, usersManagement, adminManagement);
	require('./messagePreview')(directMessaging, usersManagement, adminManagement);
	require('./directMessageTrigger')(directMessaging, usersManagement, adminManagement);
	require('./messageRecipientsFiltering')(directMessaging, usersManagement);
	require('./redisSocketTrigger')(directMessaging, usersManagement);
	
	let io;
	
	setInterval(() => {
		if(!io) {
			io = directMessaging.getSocketsConnection();
		}
		if(io){
			io.sockets.in('admin').emit('usersStats', usersManagement.getUsersStats());
		}
		
	}, 500);

	return {};
}