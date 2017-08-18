"use strict";

const parameters = require('../parameters');
const _ = require('lodash');

module.exports  = (clients, usersManagement) => {
	

	// Push notification subscription
	clients.addSocketInEvent(
		'pushSubscribe',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.messageChannels.TAB_ACTIVE,
		],
		function(data) {
			// From received data we get id, and user object 
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			if (_.isEmpty(user)) return;
			
			let io = clients.getSocketsConnection();
			let pub = clients.getRedisConnection();
			
			const machineHash = data[parameters.messageChannels.MACHINE_HASH];
			const language = data[parameters.user.LANGUAGE];
			const token = data[parameters.messageChannels.TOKEN];
			const socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
			
			// Get push data array	
			let pushData = user[parameters.messageChannels.PUSH].filter(push => push[parameters.messageChannels.TOKEN] !== token);
			
			// Add push data to the array
			let pushRegistration = {
				[parameters.messageChannels.MACHINE_HASH]: machineHash,
				[parameters.messageChannels.TOKEN]: token,
				[parameters.user.LANGUAGE]: language,
				[parameters.messageChannels.PUSH_ACTIVE]: user[parameters.user.MARKET_ALERT_ALLOW],
				[parameters.user.USER_ID]: data[parameters.user.USER_ID]
			}

			// Remove any reference to the push registration from all other users
			usersManagement.removePushRegistrations(token);
			
			// Add new push registration to the array of push registrations fot the current user
			pushData.push(pushRegistration)
			
			// Update user object
			user[parameters.messageChannels.PUSH] = [...pushData];
			
			// Get and update browser's data
			let browserData = user[parameters.messageChannels.BROWSERS].filter(browser => browser[parameters.messageChannels.MACHINE_HASH] !== machineHash);
			
			// Update user's browser object
			browserData.push({
				[parameters.messageChannels.MACHINE_HASH]: machineHash,
				[parameters.user.LANGUAGE]: language,
				[parameters.messageChannels.PUSH_ENABLED]: true
			})
			
			// Update user
			user[parameters.messageChannels.BROWSERS] = [...browserData];
			
			// Update user's socket information
			let socketObject = usersManagement.getSocketObject(user, data[parameters.messageChannels.SOCKET_ID]);
			
			// Based on the tab visibility we want to show html or push notification, so 
			// we need to set active flag on the socket that passed push subscription
			if(!_.isEmpty(socketObject)){
				socketObject[parameters.messageChannels.SOCKET_ACTIVE] = data[parameters.messageChannels.TAB_ACTIVE];
			}

			socket[parameters.messageChannels.SOCKET_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && data[parameters.messageChannels.TAB_ACTIVE];

			
			// Update sockets by joining/leaving rooms	
			const pairs = (data[parameters.messageChannels.TAB_ACTIVE] && user[parameters.user.MARKET_ALERT_ALLOW] ) ? user[parameters.user.PAIRS] : [];

			usersManagement.joinRooms(socket, pairs);
			
			usersManagement.updateUserDatabaseRecord(user);
			
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: id
			}));

			// Send data to tracking server
			pub.publish('tracking.push.register', JSON.stringify(pushRegistration))
		
		}
	)

	// Push notification removing subscription
	clients.addSocketInEvent(
		'pushUnsubscribe',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH
		],
		function(data) {
			// Get id and user's object
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			
			// Get sockets and redis instances
			let pub = clients.getRedisConnection();
			
			// Remove current push from push registrations array
			let pushData = user[parameters.messageChannels.PUSH].filter(push => push[parameters.messageChannels.MACHINE_HASH] !== data[parameters.messageChannels.MACHINE_HASH]);
			
			// Update browser's registration object
			user[parameters.messageChannels.BROWSERS].map(browser => {
				if(browser[parameters.messageChannels.MACHINE_HASH] === data[parameters.messageChannels.MACHINE_HASH]){
					browser[parameters.messageChannels.PUSH_ENABLED] = false;
				}
			});
			
			// Update user's object
			user[parameters.messageChannels.PUSH] = [...pushData];
			
			usersManagement.updateUserDatabaseRecord(user);
			
			// Publish user's data over redis
			pub.publish('updateUser', JSON.stringify({
				data: user,
				id: id
			}));

			pub.publish('tracking.push.block', JSON.stringify(data))
		
		}
	)


}