"use strict";
const parameters = require('../parameters');


module.exports = () => {
	const adminModel = {
		[parameters.admin.USERNAME]: '',
		[parameters.messageChannels.SOCKETS]: [],
		[parameters.general.SERVER_ID]: '',
		[parameters.user.TOKEN]: ''
	}

	let users = {};
	const getUsers = () => users;
	
	const getUser = username => users[username];

	const getUserModel = () => adminModel;
	
	const getSocket = (socketId, io) => io.sockets.connected[socketId];

	return {
		getUsers,
		getUser,
		getUserModel,
		getSocket
	}
}