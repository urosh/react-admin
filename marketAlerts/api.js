"use strict";
const config = require('../config');

module.exports  = (marketAlerts) => {
	const parametersList = marketAlerts.getParametersList();
	const usersManagement = marketAlerts.usersManagement;
	

	// Api methods for retrieving stats about users
	marketAlerts.addEvent(
		'/api/fetch/users',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const loggedInUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parametersList.USER_ID]);
			res.send(loggedInUsers);
		},
		'get'
	)

	marketAlerts.addEvent(
		'/api/fetch/push',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const loggedInUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parametersList.PUSH].length);
			res.send(loggedInUsers);
		},
		'get'
	)

}