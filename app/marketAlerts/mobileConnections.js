"use strict";

const config = require('../config');
const parametersList = config.parametersList;
const _ = require('lodash');

module.exports  = (marketAlerts, usersManagement) => {
	
	// Mobile App Api methods
	marketAlerts.addEvent(
		'mobileConnect',
		config.eventChannels.ROUTES,
		[
			parametersList.USER_ID,
			parametersList.LANGUAGE,
			parametersList.CULTURE,
			parametersList.TOKEN,
			parametersList.SYSTEM,
			parametersList.NOTIFICATION_DELIVERY_METHOD
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
			user[parametersList.TOKEN] = data[parametersList.TOKEN];
			user[parametersList.USER_ID] = data[parametersList.USER_ID];

			let mobiles = user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] !== data[parametersList.TOKEN] );
			
			// Remove all references to the current mobile device
			Object.keys(users)
				.map(id => users[id])
				.map(user => {
					user[parametersList.MOBILES] = user[parametersList.MOBILES].filter(mobile => {
						mobile[parametersList.TOKEN] !== data[parametersList.TOKEN];
					});
				});

			mobiles.push(data);
			user[parametersList.MOBILES] = [...mobiles];
			usersManagement.updateUserDatabaseRecord(user);

		},
		'post',
		'/devices/mobile/connect',
		true
	)

	marketAlerts.addEvent(
		'mobileLogout',
		config.eventChannels.ROUTES,
		[
			parametersList.TOKEN,
			parametersList.USER_ID,
		],
		function(data) {
			// Mobile registration function
			//usersManagement.mobileLogout(data);
			let mobileData;
			let users = usersManagement.getUsers();
			let mobileObject = usersManagement.getMobileObject(data[parametersList.USER_ID], data[parametersList.TOKEN]);
			if(!mobileObject) return;
			mobileObject[parametersList.USER_ID] = null;
			usersManagement.updateUserDatabaseRecord(user);
		},
		'post',
		'/devices/mobile/logout',
		true
	)

	marketAlerts.addEvent(
		'mobileTokenUpdate',
		config.eventChannels.ROUTES,
		[
			parametersList.OLD_TOKEN,
			parametersList.NEW_TOKEN,
		],
		function(data) {
			// Mobile registration function
			const oldToken = data[parametersList.OLD_TOKEN];
			const newToken = data[parametersList.NEW_TOKEN];
			let users = usersManagement.getUsers();
			let user = usersManagement.getMobileUser(oldToken);
			
			if(!user) return;
			
			let oldId = user[parametersList.USER_ID] ? user[parametersList.USER_ID] : oldToken;
			let newId = user[parametersList.USER_ID] ? user[parametersList.USER_ID] : newToken;
			let mobileObject = usersManagement.getMobileObject(oldId, oldToken);
			users[newId] = _.cloneDeep(users[oldId]);
			
			if(mobileObject) {
				mobileObject[parametersList.TOKEN] = newToken;
			} 

			if(!user[parametersList.USER_ID]) {
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
		config.eventChannels.ROUTES,
		[
			parametersList.TOKEN
		],
		function(data) {
			// Mobile registration function
			const token = data[parametersList.TOKEN];
			let user = usersManagement.getMobileUser(token);
			if(!user) return;
			user[parametersList.MOBILES] = user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] !== token);
			usersManagement.cleanUsersObject();
		},
		'post',
		'/devices/mobile/delete',
		true
	)


}