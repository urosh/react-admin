"use strict";
const config = require('../config');
const parametersList = config.parametersList;
module.exports = (marketAlerts, usersManagement) => {
	
	
	
	marketAlerts.addEvent('connectBrowser', 
		config.eventChannels.SOCKETS, 
		[
			parametersList.MACHINE_HASH,
			parametersList.USER_ID,
			parametersList.TEST_ENABLED,
			parametersList.MARKET_ALERT_ALLOW,
			parametersList.LANGUAGE,
			parametersList.PAIRS,
			parametersList.SOCKET_ID,
			parametersList.SERVER_ID
		], 
		function(data){
			let io = marketAlerts.getSocketsConnection();
			// Store user's data to variables for easier use
			const id = usersManagement.getUserId(data);
			const machineHash = data[parametersList.MACHINE_HASH];
			const language = data[parametersList.LANGUAGE];
			let users = usersManagement.getUsers();
			let user;
			// User's template 
			const userModel = usersManagement.getUserModel();
			
			let sockets = [];
			
			let socket = usersManagement.getSocket(data[parametersList.SOCKET_ID], io);
			
			// Update user's object with recieved data
			users[id] = Object.assign({}, userModel, users[id], data);
			user = users[id];
			user[parametersList.PAIRS] = usersManagement.generateUserPairs(data);
			user[parametersList.SOCKETS].forEach(socket => {
				socket[parametersList.SOCKET_ACTIVE] = false;
			});
			
			// Making sure we avoid duplicates. We only want to modify the socket with given id
			sockets = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== data[parametersList.SOCKET_ID]);

			sockets.push({
				[parametersList.SOCKET_ID]: data[parametersList.SOCKET_ID],
				[parametersList.LANGUAGE]: data[parametersList.LANGUAGE],
				[parametersList.MACHINE_HASH]: machineHash,
				[parametersList.SOCKET_ACTIVE]: true
			})

			user[parametersList.SOCKETS] = [...sockets];
			
			// Add user's reference to the socket	
			socket[parametersList.MACHINE_HASH] = machineHash;
			socket[parametersList.USER_ID] = data[parametersList.USER_ID];
			socket[parametersList.LANGUAGE] = data[parametersList.LANGUAGE];
			socket[parametersList.TEST_ENABLED] = data[parametersList.TEST_ENABLED];
			
			// Make socket join rooms 
			if(user[parametersList.MARKET_ALERT_ALLOW]){
				usersManagement.joinRooms(socket, user[parametersList.PAIRS], io);
			}
			
			// Adding machine info
			let browsers = user[parametersList.BROWSERS].filter(machine => machine[parametersList.MACHINE_HASH] !== machineHash );
			
			browsers.push({
				[parametersList.MACHINE_HASH]: machineHash,
				[parametersList.LANGUAGE]: language,
				[parametersList.PUSH_ENABLED]: false,
			});

			user[parametersList.BROWSERS] = [...browsers];

		}
	);

	// Closing socket connection
	marketAlerts.addEvent(
		'disconnect', 
		config.eventChannels.SOCKETS, 
		[
			parametersList.SOCKET_ID
		], 
		function(data){
			const socketId = data[parametersList.SOCKET_ID];
			let io = marketAlerts.getSocketsConnection();
			const user = usersManagement.getSocketUser(socketId, io);
			if(user){
				// Removing socket's reference from user's object
				user[parametersList.SOCKETS] = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== socketId);
			}
		}
	);


	// Browser tab active event handler
	marketAlerts.addEvent(
		'tabVisibilityChange',
		config.eventChannels.SOCKETS,
		[
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.TAB_ACTIVE,
		],
		function(data) {
			//usersManagement.browserTabVisibilityHandler(data);
			const id = usersManagement.getUserId(data);
			let io = marketAlerts.getSocketsConnection();
			const socket = usersManagement.getSocket(data[parametersList.SOCKET_ID], io);
			let user = usersManagement.getUser(id);
			let pushObject = usersManagement.getPushObject(id, data[parametersList.MACHINE_HASH]);
			let socketObject = usersManagement.getSocketObject(id, data[parametersList.SOCKET_ID]);

			// Updating push reference for a given browser
			if(pushObject) {

				// Updating socket reference in user's object
				pushObject[parametersList.PUSH_ACTIVE] = user[parametersList.MARKET_ALERT_ALLOW] && !data[parametersList.TAB_ACTIVE];
				socket[parametersList.SOCKET_ACTIVE] = user[parametersList.MARKET_ALERT_ALLOW] && data[parametersList.TAB_ACTIVE];
				
				if(socketObject){
					socketObject[parametersList.SOCKET_ACTIVE] = data[parametersList.TAB_ACTIVE];
				}

				if(user){
					const pairs = (data[parametersList.TAB_ACTIVE] && user[parametersList.MARKET_ALERT_ALLOW] )? user[parametersList.PAIRS] : [];
					
					usersManagement.joinRooms(socket, pairs);
				}
			}


		}
	)



	marketAlerts.addEvent(
		'updateMarketAlertsSubscription',
		config.eventChannels.SOCKETS,
		[
			parametersList.USER_ID,
			parametersList.MARKET_ALERT_ALLOW
		],
		function(data) {
			//usersManagement.updateMarketAlertSubscription(data);
			const id = usersManagement.getUserId(data);
			let  user = usersManagement.getUser(id);
			if(!user) return;
			let io = marketAlerts.getSocketsConnection();
			const marketAlertAllow = data[parametersList.MARKET_ALERT_ALLOW];
			
			// Update user's object
			user[parametersList.MARKET_ALERT_ALLOW] = marketAlertAllow;
			const pairs = marketAlertAllow ? user[parametersList.PAIRS] : [];
			// Tell all sockets to leave rooms
			
			user[parametersList.SOCKETS].forEach(socketData => {
				let socket = usersManagement.getSocket(socketData.SOCKET_ID, io);
				usersManagement.joinRooms(socket, pairs);
			})

			// Block push notifications
			user[parametersList.PUSH].map(push => push[parametersList.PUSH_ACTIVE] = marketAlertAllow);

		}
	)


	marketAlerts.addEvent(
		'instrumentUpdate',
		config.eventChannels.SOCKETS,
		[
			parametersList.USER_ID,
			parametersList.INSTRUMENT,
			parametersList.INSTRUMENT_STATUS
		],
		function(data) {
			//usersManagement.updateInstrument(data);
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			if (!user) return;
			let io = marketAlerts.getSocketsConnection();
			const instrument = parametersList.INSTRUMENT + '-' + data[parametersList.INSTRUMENT];
			let pairs = user[parametersList.PAIRS].filter(pair => pair !== instrument);
			
			if(data[parametersList.INSTRUMENT_STATUS]) {
				pairs.push(instrument);
			}

			// Update pairs array
			user[parametersList.PAIRS] = [...pairs];
			
			// Join/Leave room 
			user[parametersList.SOCKETS].forEach(socketData => {
				let socket = usersManagement.getSocket(socketData.SOCKET_ID, io);
				usersManagement.joinRooms(socket, pairs);
			})
		}
	)
}

