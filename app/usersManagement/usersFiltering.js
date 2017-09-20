/*
 * Utility functions to help up with filtering users based on provided criterias. 
 * 
 * These are used when filtering users for direct messaging module. Based on the provided set
 * of filteres list of users is returned that satisfy filtering criterias
 *
 */
"use strict";

const parameters = require('../parameters');

module.exports = (users) => {
	/*
	 * Filtering function. Accepts list of applied filters and returns object with stats and 
	 * users' data
	 * 
	 * @param filters object 
	 * @return object 
	 */
	const getUsersList = (filters) => {

		let initialUserList = [];
		let loggedInAlerts = [];
		let loggedOutAlerts = [];

		let alerts = [];
		let pushMessages = [];
		let mobileMessages = [];

		filters.selectedUsers.map(id => {
			initialUserList.push(users[id]);
		})
		
		if(!initialUserList.length){
			initialUserList = Object.keys(users).map(id => users[id]);
		}
		
		// Apply filters to the user list 

		// Culture filter, only if cultures filter exist and is not set to all
		if(filters.cultures && filters.cultures !== 'all'){
			initialUserList = initialUserList.filter(user => user[parameters.user.CULTURE] === filter.cultures)
		}
		
		// Logged in/out, do filtering only if defined and not set to all
		if(filters.userType && filters.userType !== 'all'){
			initialUserList = initialUserList.filter(user => {
				if(user[parameters.user.USER_ID]) {
					return filters.userType === 'in'
				}else{
					return filters.userType === 'out'
				}
			})
		}
		
		// Test/Regular
		if(filters.testUsers && filters.testUsers !== 'all'){
			initialUserList = initialUserList.filter(user => {
				if(user[parameters.user.TEST_ENABLED]) {
					return filters.userType === 'test'
				}else{
					return filters.userType === 'non-test'
				}
			})
		}
		
		initialUserList.forEach(user => {
			
			if(
				filters.deviceType === 'all' ||
				filters.deviceType === 'alert' ||
				filters.deviceType === 'browser' ||
				filters.deviceType === 'browser-alert'
			){
				let alertEnabled = 
					user[parameters.messageChannels.SOCKETS]
						.reduce((prev, curr) => {
							if(prev) return true;
							return (curr[parameters.messageChannels.SOCKET_ACTIVE] && filters.alertActiveLanguages.indexOf(curr[parameters.user.LANGUAGE]) > -1);
						}, false);
				
				if(alertEnabled){
					alerts.push(user);
				}
			}



			if(
				filters.deviceType === 'all' ||
				filters.deviceType === 'push-all' ||
				filters.deviceType === 'browser' ||
				filters.deviceType === 'browser-push'
			){
				// Push is considered enabled if the language of the user is found in the list of message 
				// languages
				user[parameters.messageChannels.PUSH]
						.map(push => {
							if(push[parameters.messageChannels.PUSH_ACTIVE] && filters.pushActiveLanguages.indexOf(push[parameters.user.LANGUAGE]) > -1){
								pushMessages.push(push);			
							}
						});
			}
			

			if(
				filters.deviceType === 'all' ||
				filters.deviceType === 'push-all' ||
				filters.deviceType === 'mobile'
			){
				user[parameters.messageChannels.MOBILES]
					.map(mobile => {
						if( filters.mobileActiveLanguages.indexOf(mobile[parameters.user.LANGUAGE]) > -1 && mobile[parameters.messageChannels.APP_VERSION_NUMBER]){
							mobileMessages.push(mobile);
						}
					});
				
			}
		});

		let pushyMobiles = [], 
		    iosMobiles = [],
		    androidMobiles = [];
		
		mobileMessages.map(mobile => {

			if(mobile[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD] === 'pushy'){
				pushyMobiles.push(mobile);
				return;
			}
			
			if(mobile[parameters.messageChannels.SYSTEM] === 'ios'){
				iosMobiles.push(mobile);
				return;
			}
			
			androidMobiles.push(mobile);
		})

		return {
			alerts: alerts.length,
			push: pushMessages.length,
			mobiles: mobileMessages.length,
			userInfo: {
				alerts: [...alerts],
				push: [...pushMessages],
				mobiles: [...mobileMessages],
				pushyMobiles: [...pushyMobiles],
				iosMobiles: [...iosMobiles],
				androidMobiles: [...androidMobiles]
			}
		}
	}

	return {
		getUsersList
	}
	


}

	
