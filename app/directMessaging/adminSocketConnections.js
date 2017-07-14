"use strict";
const parameters = require('../parameters');

module.exports = (directMessaging, usersManagement, adminManagement) => {
	directMessaging.addEvent(
		'adminConnect',
		config.eventChannels.SOCKETS,
		[
			parameters.user.USERNAME,
			parameters.user.SOCKET_ID
		],
		function(data) {
			let user;
			const username = data[parameters.admin.USERNAME];
			const socketId = data[parameters.user.SOCKET_ID];

			const userModel = adminManagement.getUserModel();
			
			let users = adminManagement.getUsers();

			users[username] = Object.assign({}, userModel, data);
			
			user = users[username];

			user[parameters.messageChannels.SOCKETS].forEach(socket => {
				socket[parameters.user.SOCKET_ACTIVE] = false;
			});
			
			let sockets = [];
			
			sockets = user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.user.SOCKET_ID] !== data[parameters.user.SOCKET_ID]);

			sockets.push({
				[parameters.user.SOCKET_ID]: data[parameters.user.SOCKET_ID],
				[parameters.user.SOCKET_ACTIVE]: true,
				[parameters.admin.USERNAME]: data[parameters.admin.USERNAME]
			});
			let io = directMessaging.getSocketsConnection();
			let socket = adminManagement.getSocket(data[parameters.user.SOCKET_ID], io);
			

			user[parameters.messageChannels.SOCKETS] = [...sockets];
			
			if(socket){
				socket[parameters.admin.USERNAME] = data[parameters.admin.USERNAME];
				socket.join(parameters.admin.ADMIN);
				socket.join(data[parameters.admin.USERNAME]);
			}

		}
	)


	directMessaging.addEvent(
		'adminPushRegister',
		config.eventChannels.SOCKETS,
		[
			parameters.admin.USERNAME,
			parameters.user.TOKEN
		],
		function(data) {
			let user = adminManagement.getUser(data[parameters.admin.USERNAME]);
			if(!user) return;
			user[parameters.user.TOKEN] = data[parameters.user.TOKEN];
			user[parameters.general.SERVER_ID] = data[parameters.general.SERVER_ID];		
		}
	)


}