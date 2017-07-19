"use strict";
const parameters = require('../parameters');
const _ = require('lodash');

module.exports = (marketAlerts, usersManagement) => {
	marketAlerts.addSocketInEvent('connectBrowser', 
		[
			parameters.messageChannels.MACHINE_HASH,
			parameters.user.USER_ID,
			parameters.user.TEST_ENABLED,
			parameters.user.MARKET_ALERT_ALLOW,
			parameters.user.LANGUAGE,
			parameters.user.PAIRS,
			parameters.messageChannels.SOCKET_ID,
			parameters.general.SERVER_ID
		], 
		function(data){
			let io = marketAlerts.getSocketsConnection();
			let pub =  marketAlerts.getRedisConnection();
			
			// Store user's data to variables for easier use
			const id = usersManagement.getUserId(data);
			const machineHash = data[parameters.messageChannels.MACHINE_HASH];
			const language = data[parameters.user.LANGUAGE];
			let users = usersManagement.getUsers();
			let user;

			// User's template 
			const userModel = usersManagement.getUserModel();
			
			let sockets = [];
			
			let socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
			
			// Update user's object with recieved data
			users[id] = Object.assign({}, userModel, users[id], data);
			user = users[id];
			user[parameters.user.PAIRS] = usersManagement.generateUserPairs(data);

			
			// Making sure we avoid duplicates. We only want to modify the socket with given id
			sockets = user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] !== data[parameters.messageChannels.SOCKET_ID]);

			sockets.push({
				[parameters.messageChannels.SOCKET_ID]: data[parameters.messageChannels.SOCKET_ID],
				[parameters.user.LANGUAGE]: data[parameters.user.LANGUAGE],
				[parameters.messageChannels.MACHINE_HASH]: machineHash,
				[parameters.messageChannels.SOCKET_ACTIVE]: true
			})

			user[parameters.messageChannels.SOCKETS] = [...sockets];
			
			// Add user's reference to the socket	
			socket[parameters.messageChannels.MACHINE_HASH] = machineHash;
			socket[parameters.user.USER_ID] = data[parameters.user.USER_ID];
			socket[parameters.user.LANGUAGE] = data[parameters.user.LANGUAGE];
			socket[parameters.user.TEST_ENABLED] = data[parameters.user.TEST_ENABLED];
			
			// Make socket join rooms 
			if(user[parameters.user.MARKET_ALERT_ALLOW]){
				usersManagement.joinRooms(socket, user[parameters.user.PAIRS], io);
			}
			
			//usersManagement.removeBrowserFromUser(machineHash);

			// Adding machine info
			let browsers = user[parameters.messageChannels.BROWSERS].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] !== machineHash );
			
			browsers.push({
				[parameters.messageChannels.MACHINE_HASH]: machineHash,
				[parameters.user.LANGUAGE]: language,
				[parameters.messageChannels.PUSH_ENABLED]: false,
				[parameters.general.SERVER_ID]: data[parameters.general.SERVER_ID],
			});

			user[parameters.messageChannels.BROWSERS] = [...browsers];
			
			if(data[parameters.general.PROCESSING_SERVER_ID] === data[parameters.general.SERVER_ID]){
				if(user[parameters.user.USER_ID]){
					pub.publish('tracking.user', JSON.stringify({
						userID:  user[parameters.user.USER_ID],
						machineHash: user[parameters.messageChannels.MACHINE_HASH],
						loggedIn: true

					}));
				}else{
					pub.publish('tracking.visitor', JSON.stringify({
						machineHash: data[parameters.messageChannels.MACHINE_HASH],
					}));
				}
			}
		},
		true
	);

	// Closing socket connection
	marketAlerts.addSocketInEvent(
		'disconnect', 
		[
			parameters.messageChannels.SOCKET_ID
		], 
		function(data){
			const socketId = data[parameters.messageChannels.SOCKET_ID];
			let io = marketAlerts.getSocketsConnection();
			let pub =  marketAlerts.getRedisConnection();
			const user = usersManagement.getSocketUser(socketId, io);
			if(user){
				// Removing socket's reference from user's object
				let socketMachine;
				user[parameters.messageChannels.SOCKETS] = user[parameters.messageChannels.SOCKETS].filter(socket => {
					if(socket[parameters.messageChannels.SOCKET_ID] === socketId){
						socketMachine = socket[parameters.messageChannels.MACHINE_HASH];
						return false;
					}
					return true;
				});
				
				if(data[parameters.general.PROCESSING_SERVER_ID] === data[parameters.general.SERVER_ID]){
					pub.publish('tracking.disconnect', JSON.stringify({
						[parameters.user.USER_ID]: user[parameters.user.USER_ID],
						[parameters.user.USER_ID]: user[parameters.user.USER_ID] ? true : false,
						[parameters.messageChannels.MACHINE_HASH]: socketMachine
					}))
				}

			}
			usersManagement.cleanUsersObject();
		},
		true
	);


	// Browser tab active event handler
	marketAlerts.addSocketInEvent(
		'tabVisibilityChange',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.messageChannels.TAB_ACTIVE,
		],
		function(data) {
			//usersManagement.browserTabVisibilityHandler(data);
			const id = usersManagement.getUserId(data);
			let io = marketAlerts.getSocketsConnection();
			const socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
			let user = usersManagement.getUser(id);
			
			if(!user) return;

			let pushObject = usersManagement.getPushObject(id, data[parameters.messageChannels.MACHINE_HASH]);
			let socketObject = usersManagement.getSocketObject(id, data[parameters.messageChannels.SOCKET_ID]);
			// Updating push reference for a given browser
			if(pushObject) {
				// Updating socket reference in user's object
				pushObject[parameters.messageChannels.PUSH_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && !data[parameters.messageChannels.TAB_ACTIVE];
				socket[parameters.messageChannels.SOCKET_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && data[parameters.messageChannels.TAB_ACTIVE];
				if(socketObject){
					socketObject[parameters.messageChannels.SOCKET_ACTIVE] = data[parameters.messageChannels.TAB_ACTIVE];
				}
				const pairs = (data[parameters.messageChannels.TAB_ACTIVE] && user[parameters.user.MARKET_ALERT_ALLOW] )? user[parameters.user.PAIRS] : [];
				
				usersManagement.joinRooms(socket, pairs);
			}
		},
		true
	)



	marketAlerts.addSocketInEvent(
		'updateMarketAlertsSubscription',
		[
			parameters.user.USER_ID,
			parameters.user.MARKET_ALERT_ALLOW
		],
		function(data) {
			//usersManagement.updateMarketAlertSubscription(data);
			const id = usersManagement.getUserId(data);
			let  user = usersManagement.getUser(id);
			if(!user) return;
			let io = marketAlerts.getSocketsConnection();
			const marketAlertAllow = data[parameters.user.MARKET_ALERT_ALLOW];
			
			// Update user's object
			user[parameters.user.MARKET_ALERT_ALLOW] = marketAlertAllow;
			const pairs = marketAlertAllow ? user[parameters.user.PAIRS] : [];
			// Tell all sockets to leave rooms
			user[parameters.messageChannels.SOCKETS].forEach(socketData => {
				let socket = usersManagement.getSocket(socketData[parameters.messageChannels.SOCKET_ID], io);
				usersManagement.joinRooms(socket, pairs);
			})

			// Block push notifications
			user[parameters.messageChannels.PUSH].map(push => push[parameters.messageChannels.PUSH_ACTIVE] = marketAlertAllow);

		},
		true
	)


	marketAlerts.addSocketInEvent(
		'instrumentUpdate',
		[
			parameters.user.USER_ID,
			parameters.user.INSTRUMENT,
			parameters.user.INSTRUMENT_STATUS
		],
		function(data) {
			//usersManagement.updateInstrument(data);
			const id = usersManagement.getUserId(data);
			let user = usersManagement.getUser(id);
			if (!user) return;
			let io = marketAlerts.getSocketsConnection();
			const instrument = parameters.user.INSTRUMENT + '-' + data[parameters.user.INSTRUMENT];
			let pairs = user[parameters.user.PAIRS].filter(pair => pair !== instrument);
			
			if(data[parameters.user.INSTRUMENT_STATUS]) {
				pairs.push(instrument);
			}

			// Update pairs array
			user[parameters.user.PAIRS] = [...pairs];
			
			// Join/Leave room 
			user[parameters.messageChannels.SOCKETS].forEach(socketData => {
				let socket = usersManagement.getSocket(socketData[parameters.messageChannels.SOCKET_ID], io);
				usersManagement.joinRooms(socket, pairs);
			})
		},
		true
	)

	marketAlerts.addSocketInEvent(
		'setMachineInfo',
		[
			[parameters.messageChannels.MACHINE_HASH], 
			[parameters.tracking.USER_AGENT], 
			[parameters.tracking.IP], 
			[parameters.tracking.COUNTRY], 
			[parameters.tracking.LATITUDE], 
			[parameters.tracking.LONGITUDE], 
			[parameters.tracking.REGION]
		],
		function(data) {
			let pub =  marketAlerts.getRedisConnection();
			let io = marketAlerts.getSocketsConnection();
			
			pub.publish('tracking.machine', JSON.stringify(data));
			var startTime = new Date();
			let socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);

			socket.emit('latency-check', data, Date.now(), function(startTime, user) {
			    var latency = Date.now() - startTime;
			    data.socketLatency = latency;
				pub.publish('tracking.machine.latency', JSON.stringify(data));
			});
		},
		false
	)
}

