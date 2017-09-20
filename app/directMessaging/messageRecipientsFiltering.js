"use strict";
const parameters = require('../parameters');

module.exports = (directMessaging, usersManagement) => {
	

	directMessaging.addSocketInEvent({
		name: 'recipientStats',
		data: [
			parameters.admin.USERNAME,
			parameters.admin.FILTERS
		],
		handler: function(data) {
			let results = [];
			let loggedInAlerts, loggedOutAlerts, pushMessages, mobileMessages;
			const filters = data.filters;
			let io = directMessaging.getSocketsConnection();
			const usersStats = usersManagement.usersFiltering.getUsersList(filters);
			io.sockets.in(data.username).emit(parameters.admin.RECIPIENT_STATS, usersStats);
		}
	})

}