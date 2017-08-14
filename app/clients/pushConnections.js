"use strict";

const parameters = require('../parameters');

module.exports  = (clients, usersManagement) => {
	

	// Push notification subscription
	clients.addSocketInEvent(
		'pushSubscribe',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.general.SERVER_ID,
			parameters.messageChannels.TAB_ACTIVE,
		],
		function(data) {
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			if (!user) return;
			
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
				[parameters.general.SERVER_ID]: data[parameters.general.SERVER_ID],
				[parameters.user.USER_ID]: data[parameters.user.USER_ID]
			}

			// Remove any reference to the push registration from all other users
			usersManagement.removePushRegistrations(token);
			
			pushData.push(pushRegistration)
			user[parameters.messageChannels.PUSH] = [...pushData];
			
			// Get and update browser's data
			let browserData = user[parameters.messageChannels.BROWSERS].filter(browser => browser[parameters.messageChannels.MACHINE_HASH] !== machineHash);
			
			browserData.push({
				[parameters.messageChannels.MACHINE_HASH]: machineHash,
				[parameters.user.LANGUAGE]: language,
				[parameters.messageChannels.PUSH_ENABLED]: true

			})


			user[parameters.messageChannels.BROWSERS] = [...browserData];
			
			// Update user's socket information
			let socketObject = usersManagement.getSocketObject(id, data[parameters.messageChannels.SOCKET_ID]);
			

			// Based on the tab visibility we want to show html or push notification, so 
			// we need to set active flag on the socket that passed push subscription
			if(socketObject){
				socketObject[parameters.messageChannels.SOCKET_ACTIVE] = data[parameters.messageChannels.TAB_ACTIVE];
			}

			socket[parameters.messageChannels.SOCKET_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && data[parameters.messageChannels.TAB_ACTIVE];

			
			// Update sockets by joining/leaving rooms	
			const pairs = (data[parameters.messageChannels.TAB_ACTIVE] && user[parameters.user.MARKET_ALERT_ALLOW] ) ? user[parameters.user.PAIRS] : [];

			usersManagement.joinRooms(socket, pairs);
			
			usersManagement.updateUserDatabaseRecord(user);

			if(data[parameters.general.PROCESSING_SERVER_ID] === data[parameters.general.SERVER_ID]){
				pub.publish('tracking.push.register', JSON.stringify(pushRegistration))
			}

		}
	)

	// Push notification removing subscription
	clients.addSocketInEvent(
		'pushUnsubscribe',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.general.SERVER_ID,
		],
		function(data) {
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			let io = clients.getSocketsConnection();
			let pub = clients.getRedisConnection();
			let pushData = user[parameters.messageChannels.PUSH].filter(push => push[parameters.messageChannels.MACHINE_HASH] !== data[parameters.messageChannels.MACHINE_HASH]);
			
			user[parameters.messageChannels.BROWSERS].map(browser => {
				if(browser[parameters.messageChannels.MACHINE_HASH] === data[parameters.messageChannels.MACHINE_HASH]){
					browser[parameters.messageChannels.PUSH_ENABLED] = false;
				}
			});

			user[parameters.messageChannels.PUSH] = [...pushData];
			usersManagement.updateUserDatabaseRecord(user);
			if(data[parameters.general.PROCESSING_SERVER_ID] === data[parameters.general.SERVER_ID]){
				pub.publish('tracking.push.block', JSON.stringify(data))
			}
			usersManagement.cleanUsersObject();

		}
	)


}