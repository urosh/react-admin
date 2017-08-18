/*
 * Group of events providing http rest api endpoints used by mobile app. 
 */

"use strict";

const parameters = require('../parameters');
const _ = require('lodash');
const fs = require('fs');

module.exports  = (clients, usersManagement) => {
	
	/*
	 * Connect method, called when user opens the app, or when the user logs in.
	 * If user is loged in, it searches for the user's registration in the system
	 * and updates it with mobile app info. If no user is found the new user is created
	 * and added to the users registrations object. 
	 *
	 * Step by step actions: 
	 * - Get user id based on the data we received. If user is logged out, we will 
	 * use mobile token as id. If user is logged in we use userID
	 * - Remove previous instances of mobile registration. This goes through all the
	 * registrations searches for devices with same token or deviceID, and deletes them. 
	 * - Create or update users object by adding mobile device data
	 * - Connect mssql to get stores marketAlertAllow and mobileParis
	 * - Update mongoDB
	 * - Send data over redis to all instances to update users object
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
		function(req, res, dat) {
			fs.readFile('/home/uros/Desktop/data.json', (err, content) => {
				res.send('Mobile device connected successfully');
				
				let result = JSON.parse(content);
				
				console.log(Object.keys(result).length);
				
				Object.keys(result)
					.map(id => result[id])
					.map(data => {
						// Make sure userID is in correct format
						if(data[parameters.user.USER_ID] === 'null') {
							data[parameters.user.USER_ID] = null;
						}

						let id = usersManagement.getUserId(data);
						

						const userModel = usersManagement.getUserModel();
						const sql = usersManagement.getSqlConnection();
						
						// Remove all references to the current mobile device
						usersManagement.removeMobileFromUsers(data[parameters.messageChannels.TOKEN], data[parameters.messageChannels.DEVICE_ID]);
						
						let user = Object.assign({}, userModel, usersManagement.getUser(id));
						
						if(!user) return;
						
						// In case the user registration is new, we need to set userId
						user[parameters.messageChannels.TOKEN] = data[parameters.messageChannels.TOKEN];
						user[parameters.user.USER_ID] = data[parameters.user.USER_ID];
						
						let mobileRegistrations = user[parameters.messageChannels.MOBILES];
						
						mobileRegistrations.push(data);
						
						let pub =  clients.getRedisConnection();
						
						if(user[parameters.user.USER_ID]){
							usersManagement.getUsersDataFromMssql(user[parameters.user.USER_ID])
								.then((response) => {
									usersManagement.updateUserDatabaseRecord(user);
									user[parameters.user.MARKET_ALERT_ALLOW] = response[parameters.user.MARKET_ALERT_ALLOW];
									
									user[parameters.user.MOBILE_PAIRS] = response[parameters.user.MOBILE_PAIRS];
									// Publish user's data over redis
									pub.publish('updateUser', JSON.stringify({
										data: user,
										id: id
									}));
								})
						}else{
							usersManagement.updateUserDatabaseRecord(user);
							// Publish user's data over redis
							pub.publish('updateUser', JSON.stringify({
								data: user,
								id: id
							}));
						}
					})
				


			})

			

			
		},
		'post',
		'/devices/mobile/connect'
	)
	
	/*
	 * Mobile logout handler
	 * 
	 * Action steps: 
	 * - Get the user of the device. 
	 * - Get the device data and update it
	 * - Update the users object
	 *
	 */
	clients.addHttpInEvent(
		'mobileLogout',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
		],
		function(req, res, data) {
			res.send('Mobile device logged out successfully');
			let mobileData;
			// Get user
			let user = usersManagement.getUser(data[parameters.user.USER_ID]);
			if(_.isEmpty(user)) return;
			// Get mobile object
			let mobileObject = usersManagement.getMobileObject(user, data[parameters.messageChannels.TOKEN]);
			
			if(_.isEmpty(mobileObject)) return;
			// Update userId
			mobileObject[parameters.user.USER_ID] = null;
				
			usersManagement.updateUserDatabaseRecord(user);
			
			// Publish user's data over redis
			let pub =  clients.getRedisConnection();

			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: user[parameters.user.USER_ID]
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
		function(req, res, data) {
			res.send('Mobile device token updated');
			// Grap new/old token references
			const oldToken = data[parameters.messageChannels.OLD_TOKEN];
			const newToken = data[parameters.messageChannels.NEW_TOKEN];
			
			// Get old user mobile registration
			let oldUser = usersManagement.getMobileUser(oldToken);
			
			if(_.isEmpty(oldUser)) return;
			// Depending if the user is logged in get the id
			let oldId = oldUser[parameters.user.USER_ID] ? oldUser[parameters.user.USER_ID] : oldToken;
			let newId = oldUser[parameters.user.USER_ID] ? oldUser[parameters.user.USER_ID] : newToken;

			let pub =  clients.getRedisConnection();

			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: {},
				id: oldId
			}));

			let newUser = _.cloneDeep(oldUser);
			
			let mobileObject = usersManagement.getMobileObject(newUser, oldToken);
			if(mobileObject) {
				mobileObject[parameters.messageChannels.TOKEN] = newToken;
			} 
			
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: newUser,
				id: newId
			}));
			
			// delete old record from db and update the new one
			// /usersManagement.updateUserDatabaseRecord(user);

		},
		'post',
		'/devices/mobile/update'
	)

	clients.addHttpInEvent(
		'mobileDelete',
		[
			parameters.messageChannels.TOKEN
		],
		function(req, res, data) {
			res.send('Mobile device deleted successfully');
			// Mobile registration function
			const token = data[parameters.messageChannels.TOKEN];
			let user = usersManagement.getMobileUser(token);
			
			if(_.isEmpty(user)) return;

			user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== token);
			let pub =  clients.getRedisConnection();
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: usersManagement.getUserId(user)
			}));


		},
		'post',
		'/devices/mobile/delete'
	)


}