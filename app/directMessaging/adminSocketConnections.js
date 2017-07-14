"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports = (directMessaging, usersManagement, adminManagement) => {
	directMessaging.addEvent(
		'adminConnect',
		config.eventChannels.SOCKETS,
		[
			parametersList.USERNAME,
			parametersList.SOCKET_ID
		],
		function(data) {
			let user;
			const username = data[parametersList.USERNAME];
			const socketId = data[parametersList.SOCKET_ID];

			const userModel = adminManagement.getUserModel();
			
			let users = adminManagement.getUsers();

			users[username] = Object.assign({}, userModel, data);
			
			user = users[username];

			user[parametersList.SOCKETS].forEach(socket => {
				socket[parametersList.SOCKET_ACTIVE] = false;
			});
			
			let sockets = [];
			
			sockets = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== data[parametersList.SOCKET_ID]);

			sockets.push({
				[parametersList.SOCKET_ID]: data[parametersList.SOCKET_ID],
				[parametersList.SOCKET_ACTIVE]: true,
				[parametersList.USERNAME]: data[parametersList.USERNAME]
			});
			let io = directMessaging.getSocketsConnection();
			let socket = adminManagement.getSocket(data[parametersList.SOCKET_ID], io);
			

			user[parametersList.SOCKETS] = [...sockets];
			
			if(socket){
				socket[parametersList.USERNAME] = data[parametersList.USERNAME];
				socket.join('admin');
				socket.join(data[parametersList.USERNAME]);
			}

		}
	)


	directMessaging.addEvent(
		'adminPushRegister',
		config.eventChannels.SOCKETS,
		[
			parametersList.USERNAME,
			parametersList.TOKEN
		],
		function(data) {
			let user = adminManagement.getUser(data[parametersList.USERNAME]);
			if(!user) return;
			user[parametersList.TOKEN] = data[parametersList.TOKEN];
			user[parametersList.SERVER_ID] = data[parametersList.SERVER_ID];		
		}
	)


}