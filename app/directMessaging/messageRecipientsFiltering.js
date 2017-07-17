"use strict";
const parameters = require('../parameters');
const userFiltering = require('./utils/usersFiltering')();

module.exports = (directMessaging, usersManagement) => {
	

	directMessaging.addEvent(
		'recipientStats',
		parameters.messageChannels.SOCKETS,
		[
			parameters.admin.USERNAME,
			parameters.admin.FILTERS
		],
		function(data) {
			let users = usersManagement.getUsers();
			let results = [];
			let loggedInAlerts, loggedOutAlerts, pushMessages, mobileMessages;
			const filters = data.filters;
			
			let io = directMessaging.getSocketsConnection();
			const usersStats = userFiltering.getUsersList(usersManagement, filters);

			io.sockets.in(data.username).emit(parameters.admin.RECIPIENT_STATS, usersStats);
		}
	)





}