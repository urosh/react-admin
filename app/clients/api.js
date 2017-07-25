"use strict";
const parameters = require('../parameters');

module.exports  = (clients, usersManagement) => {

	// Api methods for retrieving stats about users
	clients.addHttpInEvent(
		'/api/fetch/users',
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const loggedInUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.user.USER_ID]);
			res.send(loggedInUsers);
		},
		'get'
	)
	
	// Api methods for retrieving list of logged out users
	clients.addHttpInEvent(
		'/api/fetch/visitors',
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const loggedOutUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parameters.user.USER_ID]);
			res.send(loggedOutUsers);
		},
		'get'
	)
	

	// Api method for retrieving a list of users with push notifications enabled
	clients.addHttpInEvent(
		'/api/fetch/push',
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const pushUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.messageChannels.PUSH].length);
			res.send(pushUsers);
		},
		'get'
	)
	
	// Api method for retrieving a list of mobile app users
	clients.addHttpInEvent(
		'/api/fetch/mobiles',
		[],
		function(req, res) {
			const users = usersManagement.getUsers();
			const mobileUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.messageChannels.MOBILES].length);
			res.send(mobileUsers);
		},
		'get'
	)
	
	clients.addHttpInEvent(
		'/test',
		[],
		function(req, res) {
			res.send(usersManagement.getUsers());
		},
		'get'
	)
}