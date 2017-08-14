/*
 * Group of events providing http rest api endpoints used by mobile app. 
 */

"use strict";

const parameters = require('../parameters');
const _ = require('lodash');

module.exports  = (clients, usersManagement) => {
	
	/*
	 * Connect method, called when user opens the app, or when the user logs in.
	 * If user is loged in, it searches for the user's registration in the system
	 * and updates it with mobile app info. If no user is found the new user is created
	 * and added to the users registrations object. 
	 *
	 */
	clients.addHttpInEvent(
		'mobileConnect',
		[
			parameters.user.USER_ID,
			parameters.user.LANGUAGE,
			parameters.user.CULTURE,
			parameters.messageChannels.TOKEN,
			parameters.messageChannels.SYSTEM,
			parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD
		],
		function(data) {
			let id = usersManagement.getUserId(data);
			const userModel = usersManagement.getUserModel();
			const sql = usersManagement.getSqlConnection();
			;
			
			let user = Object.assign({}, userModel, usersManagement.getUser(id));
			if(!user) return;
			
			user[parameters.messageChannels.TOKEN] = data[parameters.messageChannels.TOKEN];
			
			user[parameters.user.USER_ID] = data[parameters.user.USER_ID] === 'null' ? null: data[parameters.user.USER_ID];
			
			let mobiles = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== data[parameters.messageChannels.TOKEN] );
					
			// Remove all references to the current mobile device
			usersManagement.removeMobileFromUsers(data[parameters.messageChannels.TOKEN], data[parameters.messageChannels.DEVICE_ID]);
			
			mobiles.push(data);
			
			user[parameters.messageChannels.MOBILES] = mobiles;

			usersManagement.getUsersDataFromMssql(user[parameters.user.USER_ID])
				.then((response) => {
					usersManagement.updateUserDatabaseRecord(user);
					let pub =  clients.getRedisConnection();
					
					id = usersManagement.getUserId(user);
					
					user[parameters.user.MARKET_ALERT_ALLOW] = response[parameters.user.MARKET_ALERT_ALLOW];
					
					user[parameters.user.MOBILE_PAIRS] = response[parameters.user.MOBILE_PAIRS];
					
					// Publish user's data over redis
					pub.publish('updateUser', JSON.stringify({
						data: user,
						id: id
					}));
				})

			
		},
		'post',
		'/devices/mobile/connect'
	)
	
	/*
	 * Mobile logout handler
	 */
	clients.addHttpInEvent(
		'mobileLogout',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
		],
		function(data) {
			let mobileData;
			let user = usersManagement.getUser(data[parameters.user.USER_ID]);
			if(_.isEmpty(user)) return;

			let mobileObject = usersManagement.getMobileObject(user, data[parameters.messageChannels.TOKEN]);

			if(_.isEmpty(mobileObject)) return;
			mobileObject[parameters.user.USER_ID] = null;
			usersManagement.updateUserDatabaseRecord(user);
			// Publish user's data over redis
			let pub =  clients.getRedisConnection();
			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: data[parameters.user.USER_ID]
			}));

		},
		'post',
		'/devices/mobile/logout'
	)

	clients.addHttpInEvent(
		'mobileTokenUpdate',
		[
			parameters.messageChannels.OLD_TOKEN,
			parameters.messageChannels.NEW_TOKEN,
		],
		function(data) {
			// Mobile registration function
			const oldToken = data[parameters.messageChannels.OLD_TOKEN];
			const newToken = data[parameters.messageChannels.NEW_TOKEN];
			
			let oldUser = usersManagement.getMobileUser(oldToken);
			
			if(_.isEmpty(oldUser)) return;
			
			let oldId = user[parameters.user.USER_ID] ? user[parameters.user.USER_ID] : oldToken;
			let newId = user[parameters.user.USER_ID] ? user[parameters.user.USER_ID] : newToken;

			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: {},
				id: oldId
			}));

			let newUser = _.cloneDeep(oldUser);
			
			let mobileObject = newUser[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === oldToken)[0];

			if(mobileObject) {
				mobileObject[parameters.messageChannels.TOKEN] = newToken;
			} 
			let pub =  clients.getRedisConnection();
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: newUser,
				id: newId
			}));
			
			usersManagement.updateUserDatabaseRecord(user);

		},
		'post',
		'/devices/mobile/update'
	)

	clients.addHttpInEvent(
		'mobileDelete',
		[
			parameters.messageChannels.TOKEN
		],
		function(data) {
			// Mobile registration function
			const token = data[parameters.messageChannels.TOKEN];
			let user = usersManagement.getMobileUser(token);
			
			if(_.isEmpty(user)) return;

			user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== token);
			let pub =  clients.getRedisConnection();
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: token
			}));


		},
		'post',
		'/devices/mobile/delete'
	)


}