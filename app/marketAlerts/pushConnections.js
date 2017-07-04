"use strict";

const config = require('../config');
const parametersList = config.parametersList;

module.exports  = (marketAlerts, usersManagement) => {
	

	// Push notification subscription
	marketAlerts.addEvent(
		'pushSubscribe',
		config.eventChannels.SOCKETS,
		[
			parametersList.TOKEN,
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.SERVER_ID,
			parametersList.TAB_ACTIVE,
		],
		function(data) {
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			if (!user) return;
			
			let io = marketAlerts.getSocketsConnection();
			
			const machineHash = data[parametersList.MACHINE_HASH];
			const language = data[parametersList.LANGUAGE];
			const token = data[parametersList.TOKEN];
			const socket = usersManagement.getSocket(data[parametersList.SOCKET_ID], io);
			
			// Get push data array	
			let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== token);
			// Add push data to the array
			pushData.push({
				[parametersList.MACHINE_HASH]: machineHash,
				[parametersList.TOKEN]: token,
				[parametersList.LANGUAGE]: language,
				[parametersList.PUSH_ACTIVE]: user[parametersList.MARKET_ALERT_ALLOW] && !data[parametersList.TAB_ACTIVE],
				[parametersList.SERVER_ID]: data[parametersList.SERVER_ID]
			})
			user[parametersList.PUSH] = [...pushData];
			
			// Get and update browser's data
			let browserData = user[parametersList.BROWSERS].filter(browser => browser[parametersList.MACHINE_HASH] !== machineHash);
			
			browserData.push({
				[parametersList.MACHINE_HASH]: machineHash,
				[parametersList.LANGUAGE]: language,
				[parametersList.PUSH_ENABLED]: true

			})
			
			user[parametersList.BROWSERS] = [...browserData];
			
			// Update user's socket information
			let socketObject = usersManagement.getSocketObject(id, data[parametersList.SOCKET_ID]);
			

			// Based on the tab visibility we want to show html or push notification, so 
			// we need to set active flag on the socket that passed push subscription
			if(socketObject){
				socketObject[parametersList.SOCKET_ACTIVE] = data[parametersList.TAB_ACTIVE];
			}

			socket[parametersList.SOCKET_ACTIVE] = user[parametersList.MARKET_ALERT_ALLOW] && data[parametersList.TAB_ACTIVE];

			
			// Update sockets by joining/leaving rooms	
			const pairs = (data[parametersList.TAB_ACTIVE] && user[parametersList.MARKET_ALERT_ALLOW] ) ? user[parametersList.PAIRS] : [];

			usersManagement.joinRooms(socket, pairs);
		}
	)

	// Push notification removing subscription
	marketAlerts.addEvent(
		'pushUnsubscribe',
		config.eventChannels.SOCKETS,
		[
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.SERVER_ID,
		],
		function(data) {
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			let io = marketAlerts.getSocketsConnection();
			
			let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== data[parametersList.TOKEN]);
			
			user[parametersList.PUSH].map(push => {
				if(push[parametersList.MACHINE_HASH] === data[parametersList.MACHINE_HASH]){
					push[parametersList.PUSH_ENABLED] = false;
				}
			});

			user[parametersList.PUSH] = [...pushData];
		}
	)


}