"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports  = (marketAlerts, usersManagement) => {

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
	
	// Api methods for retrieving list of logged out users
	marketAlerts.addEvent(
		'/api/fetch/visitors',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const loggedOutUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parametersList.USER_ID]);
			res.send(loggedOutUsers);
		},
		'get'
	)
	

	// Api method for retrieving a list of users with push notifications enabled
	marketAlerts.addEvent(
		'/api/fetch/push',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const pushUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parametersList.PUSH].length);
			res.send(pushUsers);
		},
		'get'
	)
	
	// Api method for retrieving a list of mobile app users
	marketAlerts.addEvent(
		'/api/fetch/mobiles',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const mobileUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parametersList.MOBILES].length);
			res.send(mobileUsers);
		},
		'get'
	)
	
	marketAlerts.addEvent(
		'/test',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			res.send(usersManagement.getUsers());
		},
		'get'
	)


}