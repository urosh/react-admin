"use strict";
const parameters = require('../parameters');

module.exports  = (clients, usersManagement) => {

	// Api method for retrieving users list
	/*clients.addHttpInEvent({
		name: 'getLoggedInUsers',
		url: '/api/fetch/users',
		handler: function(req, res) {
			const users = usersManagement.getUsers();
			const loggedInUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.user.USER_ID]);
			res.send(loggedInUsers);
		},
		method: 'get'
	})*/
	
	// Api methods for retrieving list of logged out users
	clients.addHttpInEvent({
		name: 'getLoggedOutUsers',
		url: '/api/fetch/visitors',
		handler: function(req, res) {
			const users = usersManagement.getUsers();
			const loggedOutUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parameters.user.USER_ID]);
			res.send(loggedOutUsers);
		},
		method: 'get'
	})
	

	// Api method for retrieving a list of users with push notifications enabled
	clients.addHttpInEvent({
		name: 'getBrowserPushUsers',
		url: '/api/fetch/push',
		handler: function(req, res) {
			const users = usersManagement.getUsers();
			const pushUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.messageChannels.PUSH].length);
			res.send(pushUsers);
		},
		method: 'get'
	})
	
	// Api method for retrieving a list of mobile app users
	clients.addHttpInEvent({
		name: 'getMobileUsers',
		url: '/api/fetch/mobiles',
		handler: function(req, res) {
			const users = usersManagement.getUsers();
			const mobileUsers = Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.messageChannels.MOBILES].length);
			res.send(mobileUsers);
		},
		method: 'get'
	})
	
	clients.addHttpInEvent({
		name: 'getAllUsers',
		url: '/api/fetch/users',
		handler: function(req, res) {
			res.send(usersManagement.getUsers());
		},
		method: 'get'
	})

	clients.addHttpInEvent({
		name: 'csvStats',
		url: '/api/fetch/csv/stats',
		handler: function(req, res) {
			console.log(usersManagement.getCsvStats(req.body.users));
			res.send(usersManagement.getCsvStats(req.body.users));
		},
		method: 'post',
	});

	clients.addHttpInEvent({
		name: 'userStats',
		url: '/api/fetch/user/stats',
		handler: function(req, res) {
			console.log('getting users stats');
			res.send(usersManagement.getUserStats());
		},
		method: 'get',
	});	



}