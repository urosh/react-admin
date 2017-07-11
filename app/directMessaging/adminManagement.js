"use strict";
const config = require('../config');
const parametersList = config.parametersList;


module.exports = () => {
	const admin = {
		[parametersList.USERNAME]: '',
		[parametersList.SOCKETS]: [],
		[parametersList.SERVER_ID]: '',
		[parametersList.TOKEN]: ''
	}

	let users = {};
	const getUsers = () => admin;
	
	const getUser = username => {
		return Object.keys(users)
			.map(id => users[id])
			.filter(user => user[parametersList.USERNAME] === username);
	}

	const getUserModel = () => admin;
	
	const getSocket = (socketId, io) => io.sockets.connected[socketId];
	
	

	return {
		getUsers,
		getUser,
		getUserModel,
		getSocket
	}
}