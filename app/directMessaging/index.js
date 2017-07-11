"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports = function(directMessaging, usersManagement){
	
	let adminManagement = require('./adminManagement')();

	require('./authentication')(directMessaging);
	require('./socketConnections')(directMessaging, usersManagement, adminManagement);
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