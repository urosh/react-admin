"use strict";

const parameters = require('../parameters');
const _ = require('lodash');

module.exports  = (marketAlerts, usersManagement) => {
	
	// Mobile App Api methods
	marketAlerts.addEvent(
		'mobileConnect',
		parameters.messageChannels.ROUTES,
		[
			parameters.user.USER_ID,
			parameters.user.LANGUAGE,
			parameters.user.CULTURE,
			parameters.messageChannels.TOKEN,
			parameters.messageChannels.SYSTEM,
			parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD
		],
		function(data) {
			// Mobile registration function
			//usersManagement.addMobileDevice(data);
			const id = usersManagement.getUserId(data);
			const userModel = usersManagement.getUserModel();
			let users = usersManagement.getUsers();
			if(!users) return;
			let user;
			users[id] = Object.assign({}, userModel, users[id]);
			user = users[id];
			user[parameters.messageChannels.TOKEN] = data[parameters.messageChannels.TOKEN];
			user[parameters.user.USER_ID] = data[parameters.user.USER_ID];

			let mobiles = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== data[parameters.messageChannels.TOKEN] );
			
			// Remove all references to the current mobile device
			Object.keys(users)
				.map(id => users[id])
				.map(user => {
					user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(mobile => {
						mobile[parameters.messageChannels.TOKEN] !== data[parameters.messageChannels.TOKEN];
					});
				});

			mobiles.push(data);
			user[parameters.messageChannels.MOBILES] = [...mobiles];
			usersManagement.updateUserDatabaseRecord(user);

		},
		'post',
		'/devices/mobile/connect',
		true
	)

	marketAlerts.addEvent(
		'mobileLogout',
		parameters.messageChannels.ROUTES,
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
		],
		function(data) {
			// Mobile registration function
			//usersManagement.mobileLogout(data);
			let mobileData;
			let users = usersManagement.getUsers();
			let mobileObject = usersManagement.getMobileObject(data[parameters.user.USER_ID], data[parameters.messageChannels.TOKEN]);
			if(!mobileObject) return;
			mobileObject[parameters.user.USER_ID] = null;
			usersManagement.updateUserDatabaseRecord(user);
		},
		'post',
		'/devices/mobile/logout',
		true
	)

	marketAlerts.addEvent(
		'mobileTokenUpdate',
		parameters.messageChannels.ROUTES,
		[
			parameters.messageChannels.OLD_TOKEN,
			parameters.messageChannels.NEW_TOKEN,
		],
		function(data) {
			// Mobile registration function
			const oldToken = data[parameters.messageChannels.OLD_TOKEN];
			const newToken = data[parameters.messageChannels.NEW_TOKEN];
			let users = usersManagement.getUsers();
			let user = usersManagement.getMobileUser(oldToken);
			
			if(!user) return;
			
			let oldId = user[parameters.user.USER_ID] ? user[parameters.user.USER_ID] : oldToken;
			let newId = user[parameters.user.USER_ID] ? user[parameters.user.USER_ID] : newToken;
			let mobileObject = usersManagement.getMobileObject(oldId, oldToken);
			users[newId] = _.cloneDeep(users[oldId]);
			
			if(mobileObject) {
				mobileObject[parameters.messageChannels.TOKEN] = newToken;
			} 

			if(!user[parameters.user.USER_ID]) {
				usersManagement.updateUserDatabaseRecord(users[oldToken]);
				delete users[oldToken];
			}

			usersManagement.updateUserDatabaseRecord(user);

		},
		'post',
		'/devices/mobile/update',
		true
	)

	marketAlerts.addEvent(
		'mobileDelete',
		parameters.messageChannels.ROUTES,
		[
			parameters.messageChannels.TOKEN
		],
		function(data) {
			// Mobile registration function
			const token = data[parameters.messageChannels.TOKEN];
			let user = usersManagement.getMobileUser(token);
			if(!user) return;
			user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== token);
			usersManagement.cleanUsersObject();
		},
		'post',
		'/devices/mobile/delete',
		true
	)


}