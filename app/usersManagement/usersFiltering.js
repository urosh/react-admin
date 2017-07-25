"use strict";

const parameters = require('../parameters');

module.exports = (users) => {
	const getUsersList = (filters) => {
		
		console.log('Starting the filtering');

		const loggedInAlerts = Object.keys(users)
			.map(id => users[id])
			// Get only logged in users
			.filter(user => user[parameters.user.USER_ID])
			.filter(user => filters.messageType === 'all' || filters.messageType === 'alert')
			// Filter by user type, we want logged in users only if user type is all or in
			.filter(user =>  !filters.userType || filters.userType === 'all' || filters.userType === 'in')
			// Check culture filter
			.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parameters.user.CULTURE])
			// Check test user filter
			.filter(user => {
				return 	(filters.testUsers === 'test' && user.testEnabled) || 
						(filters.testUsers === 'all') ||
						(filters.testUsers === 'non-test' && !user.testEnabled)
			})
			// User has to have at least one socket active
			.filter(user => {
				return user[parameters.messageChannels.SOCKETS].reduce((prev, curr) => {
						if(prev) return true;
						return curr[parameters.messageChannels.SOCKET_ACTIVE];
					}, false);
			})
			.filter(user => (!filters.selectedUsers.length || filters.selectedUsers.indexOf(user[parameters.user.USER_ID]) > -1))

		
		const loggedOutAlerts = Object.keys(users)
			.map(id => users[id])
			.filter(user => !user[parameters.user.USER_ID])
			.filter(user => filters.messageType === 'all' || filters.messageType === 'alert')
			.filter(user => !filters.userType || filters.userType === 'all' || filters.userType === 'out')
			.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parameters.user.CULTURE])
			.filter(user => {
				return 	(filters.testUsers === 'test' && user.testEnabled) || 
					(filters.testUsers === 'all') ||
					(filters.testUsers === 'non-test' && !user.testEnabled)
			})
			.filter(user => {
				return user[parameters.messageChannels.SOCKETS]
					.reduce((prev, curr) => {
						if(prev) return true;
						return curr[parameters.messageChannels.SOCKET_ACTIVE];
					}, false);
			})
			.filter(user => !filters.selectedUsers.length);
		
		const pushMessages = Object.keys(users)
			.map(id => users[id])
			.filter(user => {
				return user[parameters.messageChannels.PUSH].reduce((prev, curr) => {
						if(prev) return true;
						return curr[parameters.messageChannels.PUSH_ACTIVE];
					}, false);
			})
			.filter(user => {
				if(!filters.userType || filters.userType === 'all') return true;
				if(user[parameters.user.USER_ID]){
					if(filters.userType === 'in') return true;
				}else{
					if(filters.userType === 'out') return true;
				}
				return false;
			})
			.filter(user => {
				if(filters.testUsers === 'test' && !user[parameters.user.TEST_ENABLED]) return false;
				if(filters.testUsers === 'non-test' && user[parameters.user.TEST_ENABLED]) return false;
				return true;
			})
			.filter(user => !filters.cultures || filters.cultures === 'all' || filters.cultures === user[parameters.user.CULTURE])
			.filter(user => filters.messageType === 'all' || filters.messageType === 'push')
			.filter(user => !filters.selectedUsers.length || filters.selectedUsers.indexOf(user[parameters.user.USER_ID]) > -1)
		
		const mobileMessages = [];

		return {
			alerts: loggedOutAlerts.length + loggedInAlerts.length,
			push: pushMessages.length,
			mobiles: mobileMessages.length,
			userInfo: {
				alerts: [...loggedOutAlerts, ...loggedInAlerts],
				push: [...pushMessages],
				mobiles: [...mobileMessages]
			}
		}
	}

	return {
		getUsersList
	}
	


}

	
