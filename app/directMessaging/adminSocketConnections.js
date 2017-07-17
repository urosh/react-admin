"use strict";
const parameters = require('../parameters');

module.exports = (directMessaging, usersManagement, adminManagement) => {
	directMessaging.addEvent(
		'adminConnect',
		parameters.messageChannels.SOCKETS,
		[
			parameters.user.USERNAME,
			parameters.messageChannels.SOCKET_ID
		],
		function(data) {
			let user;
			const username = data[parameters.admin.USERNAME];
			const socketId = data[parameters.messageChannels.SOCKET_ID];

			const userModel = adminManagement.getUserModel();
			
			let users = adminManagement.getUsers();

			users[username] = Object.assign({}, userModel, data);
			
			user = users[username];

			user[parameters.messageChannels.SOCKETS].forEach(socket => {
				socket[parameters.messageChannels.SOCKET_ACTIVE] = false;
			});
			
			let sockets = [];
			
			sockets = user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] !== data[parameters.messageChannels.SOCKET_ID]);

			sockets.push({
				[parameters.messageChannels.SOCKET_ID]: data[parameters.messageChannels.SOCKET_ID],
				[parameters.messageChannels.SOCKET_ACTIVE]: true,
				[parameters.admin.USERNAME]: data[parameters.admin.USERNAME]
			});
			let io = directMessaging.getSocketsConnection();
			let socket = adminManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
			

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
		parameters.messageChannels.SOCKETS,
		[
			parameters.admin.USERNAME,
			parameters.messageChannels.TOKEN
		],
		function(data) {
			let user = adminManagement.getUser(data[parameters.admin.USERNAME]);
			if(!user) return;
			user[parameters.messageChannels.TOKEN] = data[parameters.messageChannels.TOKEN];
			user[parameters.general.SERVER_ID] = data[parameters.general.SERVER_ID];		
		}
	)


}