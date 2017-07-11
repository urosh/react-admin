"use strict";
const config = require('../config');
const parametersList = config.parametersList;

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
			// If there is a list of user id's, we just grab these users
			if(filters.selectedUsers.length > 0) {
				results = Object.keys(users)
					.filter(id => filtets.selectedUsers.indexOf(id))
					.map(id => users[id])
					.filter(user => {
						let socketActive, pushActive, mobileActive;
						mobileActive = user[parametersList.MOBILES].length > 0;
						pushActive = user[parametersList.PUSH].reduce((prev, curr) => {
							if(prev) return true;
							return curr[parametersList.PUSH_ACTIVE];
						}, false);
						socketActive = user[parametersList.SOCKETS].reduce((prev, curr) => {
							if(prev) return true;
							return curr[parametersList.SOCKET_ACTIVE];
						});
						return mobileActive || pushActive || socketActive; 
						
					});
				return results;
			}
			
			loggedInAlerts = Object.keys(users)
				.map(id => users[id])
				// Get only logged in users
				.filter(user => user[parametersList.USER_ID])
				.filter(user => filters.messageType === 'all' || filters.messageType === 'alert')
				// Filter by user type, we want logged in users only if user type is all or in
				.filter(user =>  !filters.userType || filters.userType === 'all' || filters.userType === 'in')
				// Check culture filter
				.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parametersList.CULTURE])
				// Check test user filter
				.filter(user => {
					return 	(filters.testUsers === 'test' && user.testEnabled) || 
							(filters.testUsers === 'all') ||
							(filters.testUsers === 'non-test' && !user.testEnabled)
				})
				// User has to have at least one socket active
				.filter(user => {
					return user[parametersList.SOCKETS].reduce((prev, curr) => {
							if(prev) return true;
							return curr[parametersList.SOCKET_ACTIVE];
						}, false);
				})
			
			loggedOutAlerts = Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parametersList.USER_ID])
				.filter(user => filters.messageType === 'all' || filters.messageType === 'alert')
				.filter(user => !filters.userType || filters.userType === 'all' || filters.userType === 'out')
				.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parametersList.CULTURE])
				.filter(user => {
					return 	(filters.testUsers === 'test' && user.testEnabled) || 
						(filters.testUsers === 'all') ||
						(filters.testUsers === 'non-test' && !user.testEnabled)
				})
				.filter(user => {
					return user[parametersList.SOCKETS]
						.reduce((prev, curr) => {
							if(prev) return true;
							return curr[parametersList.SOCKET_ACTIVE];
						}, false);
				})
				
			
			pushMessages = Object.keys(users)
				.map(id => users[id])
				.filter(user => {
					return user[parametersList.PUSH].reduce((prev, curr) => {
							if(prev) return true;
							return curr[parametersList.PUSH_ACTIVE];
						}, false);
				})
				.filter(user => {
					if(!filters.userType || filters.userType === 'all') return true;
					if(user[parametersList.USER_ID]){
						if(filters.userType === 'in') return true;
					}else{
						if(filters.userType === 'out') return true;
					}
					return false;
				})
				.filter(user => {
					if(filters.testUsers === 'test' && !user[parametersList.TEST_ENABLED]) return false;
					if(filters.testUsers === 'non-test' && user[parametersList.TEST_ENABLED]) return false;
					return true;
				})
				.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parametersList.CULTURE])
				.filter(user => filters.messageType === 'all' || filters.messageType === 'push')

			mobileMessages = [];
			let io = directMessaging.getSocketsConnection();

			io.sockets.in(data.username).emit('recipientStats', {
	    		alerts: loggedOutAlerts.length + loggedInAlerts.length,
	    		push: pushMessages.length,
	    		mobiles: mobileMessages.length,
	    		userInfo: {
	    			alerts: [...loggedOutAlerts, ...loggedInAlerts],
	    			push: [...pushMessages],
	    			mobiles: [...mobileMessages]
	    		}
	    	});
		}
	)





}