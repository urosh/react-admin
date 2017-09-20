"use strict";
const parameters = require('../parameters');
const _ = require('lodash');

module.exports = (clients, usersManagement) => {
	
	/*
	 * Browser connect event. 
	 * 
	 * Triggered whenever socket connection is established
	 * It updates user's registration with socketId and with 
	 * various user data retreived from the client on page load. Usualy connect
	 * event is initiated just after the page is loaded, which means the information
	 * passed to the server is the most up to date information related to the given 
	 * user. 
	 */
	const connectBrowser = data => {
		// Get socket and redis connection instances
		let io = clients.getSocketsConnection();
		let pub =  clients.getRedisConnection();
		
		// Store user's data to variables for easier use
		const id = usersManagement.getUserId(data);
		const machineHash = data[parameters.messageChannels.MACHINE_HASH];
		const language = data[parameters.user.LANGUAGE];
		
		// User's template 
		const userModel = usersManagement.getUserModel();
		
		let sockets = [];
		// get socket object		
		let socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
		
		// Deep cloning users registration, so that no modifications of users data
		// is done in handler. Instead we are publishing redis event with user's data 
		let user = Object.assign({}, userModel, usersManagement.getUser(id), data);
		
		// Generate instrument pairs based on the user's data
		user[parameters.user.PAIRS] = usersManagement.generateUserPairs(data);
		
		// Making sure we avoid duplicates. We only want to modify the socket with given id
		sockets = user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] !== data[parameters.messageChannels.SOCKET_ID]);

		// Add socket registration
		sockets.push({
			[parameters.messageChannels.SOCKET_ID]: data[parameters.messageChannels.SOCKET_ID],
			[parameters.user.LANGUAGE]: data[parameters.user.LANGUAGE],
			[parameters.messageChannels.MACHINE_HASH]: machineHash,
			[parameters.messageChannels.SOCKET_ACTIVE]: true
		})
		
		// Update user's object
		user[parameters.messageChannels.SOCKETS] = sockets;
		
		if(socket){
			// Add user's reference to the socket	
			socket[parameters.messageChannels.MACHINE_HASH] = machineHash;
			socket[parameters.user.USER_ID] = data[parameters.user.USER_ID];
			socket[parameters.user.LANGUAGE] = data[parameters.user.LANGUAGE];
			socket[parameters.user.TEST_ENABLED] = data[parameters.user.TEST_ENABLED];
			
			// Make socket join rooms 
			if(user[parameters.user.MARKET_ALERT_ALLOW]){
				usersManagement.joinRooms(socket, user[parameters.user.PAIRS], io);
			}
		}
		
		
		// Adding machine info
		let browsers = user[parameters.messageChannels.BROWSERS].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] !== machineHash );
		
		// Adding browser registration to the user's object
		browsers.push({
			[parameters.messageChannels.MACHINE_HASH]: machineHash,
			[parameters.user.LANGUAGE]: language,
			[parameters.messageChannels.PUSH_ENABLED]: false,
		});

		user[parameters.messageChannels.BROWSERS] = [...browsers];
		
		// Publish user's data over redis
		usersManagement.setUsersData(user, id);
		
	}

	const connectBrowserTracker = data => {
		let pub =  clients.getRedisConnection();

		if(data[parameters.user.USER_ID]){
			pub.publish('tracking.user', JSON.stringify({
				userID:  data[parameters.user.USER_ID],
				machineHash: data[parameters.messageChannels.MACHINE_HASH],
				loggedIn: true

			}));
		}else{
			pub.publish('tracking.visitor', JSON.stringify({
				machineHash: data[parameters.messageChannels.MACHINE_HASH],
			}));
		}
	}
	
	/*
	 * Closing socket connection handler. 
	 * Removes the socket object from user's data 
	 */
	const disconnect = data => {
		const socketId = data[parameters.messageChannels.SOCKET_ID];
		let io = clients.getSocketsConnection();
		let pub =  clients.getRedisConnection();
		
		// Cloning user object from users registrations object
		const user = usersManagement.getSocketUser(socketId, io);
		
		if(_.isEmpty(user)) return;

		// Removing socket's reference from user's object
		let socketMachine;
		
		user[parameters.messageChannels.SOCKETS] = user[parameters.messageChannels.SOCKETS].filter(socket => {
			if(socket[parameters.messageChannels.SOCKET_ID] === socketId){
				socketMachine = socket[parameters.messageChannels.MACHINE_HASH];
				return false;
			}
			return true;
		});
		
		/*
		 * At this point we have no information which parameter is used as user's key 
		 * in the registrations object. Currently three parameters can be used as
		 * keys: userID, machineHash and mobile token. If user is logged in we always use userID,
		 * depending on the device browser or mobile we use machineHash or mobile token. In order to get the * id parameter we make a request to the userManagement.getIdParameter helper method. Then 
		 * we can pass the object and object's key over redis
		 *
		 */
		let userIdParameter = usersManagement.getIdParameter(user);
		

		// Publish user's data over redis
		
		usersManagement.setUsersData(user, user[userIdParameter]);
		
		// TODO TRACKING
		/*pub.publish('tracking.disconnect', JSON.stringify({
			[parameters.user.USER_ID]: user[parameters.user.USER_ID] ? true : false,
			[parameters.messageChannels.MACHINE_HASH]: socketMachine
		}))*/
	}
	

	/*
	 * Tab visibility change handler. 
	 * Event that manages user's connections as they navigate from and back to the page. When 
	 * the user is active on the EM platform socket based alert should be displayed. If the user is 
	 * not on the platform we should show push notification.
	 *
	 */
	const tabVisibilityChange = data => {
		//usersManagement.browserTabVisibilityHandler(data);
		const id = usersManagement.getUserId(data);
		// Clone user's object from users object 
		let user = usersManagement.getUser(id);
		
		let pub =  clients.getRedisConnection();

		if(_.isEmpty(user)) return;
		
		let io = clients.getSocketsConnection();
		
		// Get socket object
		const socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
		
		// Get push and socket registrations 
		let pushObject = usersManagement.getPushObject(user, data[parameters.messageChannels.MACHINE_HASH]);

		let socketObject = usersManagement.getSocketObject(user, data[parameters.messageChannels.SOCKET_ID]);

		// If user has push enabled on the machine that triggered the event update the registration
		if(!_.isEmpty(pushObject)) {
			
			// Set push object pushActive flag to true/false
			pushObject[parameters.messageChannels.PUSH_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && !data[parameters.messageChannels.TAB_ACTIVE];
			
			// Set socket active flag on current socket
			if(socket){
				socket[parameters.messageChannels.SOCKET_ACTIVE] = user[parameters.user.MARKET_ALERT_ALLOW] && data[parameters.messageChannels.TAB_ACTIVE];				
				const pairs = ( data[parameters.messageChannels.TAB_ACTIVE] && user[parameters.user.MARKET_ALERT_ALLOW] )? user[parameters.user.PAIRS] : [];
				usersManagement.joinRooms(socket, pairs);
			}

			if(!_.isEmpty(socketObject)){
				socketObject[parameters.messageChannels.SOCKET_ACTIVE] = data[parameters.messageChannels.TAB_ACTIVE];
			}
			
			usersManagement.setUsersData(user, id);

		}
	}

	/*
	 * Updating Market Alert's subscription
	 */
	const updateMarketAlertsSubscription = data => {
		// Clone user's object
		const id = usersManagement.getUserId(data);
		let  user = usersManagement.getUser(id);
		
		if(_.isEmpty(user)) return;
		
		let io = clients.getSocketsConnection();
		let pub =  clients.getRedisConnection();

		const marketAlertAllow = data[parameters.user.MARKET_ALERT_ALLOW];
		
		// Update user's object
		user[parameters.user.MARKET_ALERT_ALLOW] = marketAlertAllow;
		
		const pairs = marketAlertAllow ? user[parameters.user.PAIRS] : [];
		
		// Tell all sockets to leave rooms
		user[parameters.messageChannels.SOCKETS].forEach(socketData => {
			let socket = usersManagement.getSocket(socketData[parameters.messageChannels.SOCKET_ID], io);
			if(socket){
				usersManagement.joinRooms(socket, pairs);
			}
		})

		// Block push notifications
		user[parameters.messageChannels.PUSH].map(push => push[parameters.messageChannels.PUSH_ACTIVE] = marketAlertAllow);

		// Publish user's data over redis
		usersManagement.setUsersData(user, id);

	}
	/*
	 * Adding/Removing instrument from the favorite list. This call is triggered from the browsers 
	 * trade zone by clicking on the instrument in the side bar. 
	 */
	const instrumentUpdate = data => {
		// Cloning users's object
		const id = usersManagement.getUserId(data);
		let user = usersManagement.getUser(id);
		
		if (_.isEmpty(user)) return;
		
		const instrument = parameters.user.INSTRUMENT + '-' + data[parameters.user.INSTRUMENT];
		
		let pairs = user[parameters.user.PAIRS].filter(pair => pair !== instrument);
		
		if(data[parameters.user.INSTRUMENT_STATUS]) {
			pairs.push(instrument);
		}

		// Update pairs array
		user[parameters.user.PAIRS] = pairs;
		
		// Join/Leave room 
		let io = clients.getSocketsConnection();
		let pub =  clients.getRedisConnection();

		user[parameters.messageChannels.SOCKETS].forEach(socketData => {
			let socket = usersManagement.getSocket(socketData[parameters.messageChannels.SOCKET_ID], io);
			if(socket){
				usersManagement.joinRooms(socket, pairs);
			}
		})
		
		usersManagement.setUsersData(user, id);
	}
	
	/*
	 * Helper event that measures socket latency and sends this information to the tracking
	 * module. 
	 */
	const setMachineInfo = data => {
		let pub =  clients.getRedisConnection();
		let io = clients.getSocketsConnection();
		
		pub.publish('tracking.machine', JSON.stringify(data));
		var startTime = new Date();
		let socket = usersManagement.getSocket(data[parameters.messageChannels.SOCKET_ID], io);
		if(socket){
			socket.emit('latency-check', data, Date.now(), function(startTime, user) {
			    var latency = Date.now() - startTime;
			    data.socketLatency = latency;
				pub.publish('tracking.machine.latency', JSON.stringify(data));
			});
		}
	}

	return {
		connectBrowser,
		connectBrowserTracker,
		disconnect,
		tabVisibilityChange,
		updateMarketAlertsSubscription,
		instrumentUpdate,
		setMachineInfo
	}
}