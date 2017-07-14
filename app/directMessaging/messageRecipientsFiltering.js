"use strict";
const config = require('../config');
const parametersList = config.parametersList;
const userFiltering = require('./utils/usersFiltering')();

module.exports = (directMessaging, usersManagement) => {
	

	directMessaging.addEvent(
		'recipientStats',
		config.eventChannels.SOCKETS,
		[
			parametersList.USERNAME,
			parametersList.FILTERS
		],
		function(data) {
			let users = usersManagement.getUsers();
			let results = [];
			let loggedInAlerts, loggedOutAlerts, pushMessages, mobileMessages;
			const filters = data.filters;
			
			let io = directMessaging.getSocketsConnection();
			const usersStats = userFiltering.getUsersList(usersManagement, filters);

			io.sockets.in(data.username).emit('recipientStats', usersStats);
		}
	)





}