"use strict";

module.exports = function(directMessaging, usersManagement){
	
	let adminManagement = require('./adminManagement')();

	require('./adminAuthentication')(directMessaging);
	require('./adminSocketConnections')(directMessaging, usersManagement, adminManagement);
	require('./messageTriggers')(directMessaging, usersManagement, adminManagement);
	require('./messageRecipientsFiltering')(directMessaging, usersManagement);
	
	let io;
	
	setInterval(() => {
		if(!io) {
			io = directMessaging.getSocketsConnection();
		}
		io.sockets.in('admin').emit('userUpdate', usersManagement.getUsersStats());
		
	}, 500);

	return {};
}