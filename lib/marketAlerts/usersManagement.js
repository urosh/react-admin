"use strict";
const parametersList = require('./parameterList').parametersList;
const messageChannels = require('./parameterList').messageChannels;
const globalPairs = require('../../config').globalPairs;
let io;

const init = i => {
	io = i
}

const socketConnection = {
	[parametersList.SOCKET_ID]: '',
	[parametersList.SOCKET_ACTIVE]: '',
	[parametersList.LANGUAGE]: '',
	[parametersList.MACHINE_HASH]: ''
};

const browser = {
	[parametersList.MACHINE_HASH]: '',
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: '',
	[parametersList.PUSH_ENABLED]: false,
	[parametersList.TEST_ENABLED]: false,
	[parametersList.PUSH_ACTIVE]: false
}

const push = {
	[parametersList.MACHINE_HASH]: '',
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: '',
	[parametersList.PUSH_ACTIVE]: false
}

const mobile = {
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: ''
}

const user = {
	[parametersList.USER_ID]: '',
	[parametersList.USER_LOGGED_IN]: false,
	[parametersList.PAIRS]: [],
	[parametersList.TEST_ENABLED]: false,
	[parametersList.MARKET_ALERT_ALLOW]: true,
	[parametersList.CULTURE]: 'eu',
	[parametersList.ACCOUNT_BASE_CURRENCY]: null,
	[parametersList.ALLOW_DEPOSIT]: null,
	[parametersList.ALLOW_WITHDRAWAL]: null,
	[parametersList.ALLOWED_CANCELLATION]: null,
	[parametersList.COUNTRY_NAME]: null,
	[parametersList.COUNTRY_ID]: null,
	[parametersList.DEFAULT_PORTAL]: null,
	[parametersList.DEMO_EXPIRATION_DAYS]: null,
	[parametersList.HAS_CREDIT_CARD]: null,
	[parametersList.HAS_MT4_ACCOUNT]: null,
	[parametersList.IS_ACTIVE]: null,
	[parametersList.IS_ACCOUNT_CLOSED]: null,
	[parametersList.WITHDRAWAL_AVAILABLE]: null,
	[parametersList.PUSH]: [],
	[parametersList.SOCKETS]: [],
	[parametersList.BROWSERS]: [],
	[parametersList.MOBILES]: [],
}

let users = {};

const getLoggedOutBrowserUser = (machineHash) => {
	let user = {};

	/*if(users[machineHash] && users[machineHash])*/
}

const getUsersSockets = (id) => {
	if(!users[id]) return [];
	return [...users[id].sockets];
}

const checkIfUserExists = id => {
	return users[id];
}

const checkIfSocketExists = (id, socketID) => {
	let index = -1;

	users[id][parametersList.SOCKETS].forEach((socket, i) => {
		if(socketID === socket[parametersList.SOCKET_ID]) {
			index = i;
		} 
	});

	return index;
} 


/*
 * API function that gives access to the users object 
 */
const getUsers = () => users;

/* 
 * Helper function to get user identifier. 
 * 
 * It checks if there is userId in data object and returns it if there 
 * (Logged in users). If userId is null return machineHash (Logged out users).
 *
 * @param object data. Users data
 * @return string id. 
 */
const getUserId = data => {
	return data[parametersList.USER_ID] || data[parametersList.MACHINE_HASH];
}

/*
 * Helper function that returns elements from target array that are 
 * not present in source. 
 * 
 * The function is used to determine rooms that need to be joined/left by sockets
 *
 * @param array target
 * @param array source
 * @return array
 */
const getArrayDifference = (target, source) => {
	return target.filter(t => source.indexOf(t) === -1);
}
/*
 * Adding socket to given rooms
 * 
 * Used to join rooms, when registering sockets, user status changes or tab visibility changes
 * 
 * @param object socket. Socket instance
 * @param array rooms. Rooms to join
 * @return void
 */
 const joinRooms = (socket, rooms) => {
	if(!socket && !rooms) return;
	
	let joinRooms = [];
	let leaveRooms = [];

	rooms.forEach(room => {
		socket.join(room);
	})
	const currentRooms = Object.keys(io.sockets.adapter.rooms).filter(pair => pair.indexOf(parametersList.INSTRUMENT) > -1);
	console.log(currentRooms);
 }

 /*
 * Removing socket from given rooms
 * 
 * Used to leave rooms, when registering sockets, user status changes or tab visibility changes
 * 
 * @param object socket. Socket instance
 * @param array rooms. Rooms to leave
 * @return void
 */
 const leaveRooms = (socket, rooms) => {
 	if(!socket && !rooms) return;
	rooms.forEach(room => {
		socket.leave(room);
	})

 }



/*
 * Helper function that generates instrument pairs based on user's data
 *
 * It checks if user is logged in or out, marketAlertAllow flag, testEnabled flag
 * and personal favorites, and returns array of pairs relevant to the user. 
 *
 * @param object user's data
 * @return array Instrument pairs. 
 */ 
const generateUserPairs = (data) => {
	let pairs = [];
	const userLoggedIn = data[parametersList.USER_LOGGED_IN];
	const language = data[parametersList.LANGUAGE];
	const culture = data[parametersList.CULTURE];
	const usersPairs = data[parametersList.PAIRS];
	const machineHash = data[parametersList.MACHINE_HASH];
	const userId = data[parametersList.USER_ID];
	const marketAlertAllow = data[parametersList.MARKET_ALERT_ALLOW];
	const testEnabled = data[parametersList.TEST_ENABLED];

	// If user is logged out add machine hast to pairs, to be able to 
	// target logged out users
	if(!userLoggedIn){
		pairs.push(machineHash);
	}else{
		// Add user id, to be able to target users
		pairs.push(userId);
	}
	// If market alerts are not allowed 
	if(!marketAlertAllow) return pairs;
	
	// Add global pairs
	globalPairs.forEach(pair => {
		pairs.push(language + '-' + parametersList.INSTRUMENT + '-' + pair);
		if(testEnabled){
			pairs.push('test-' + language + '-' + parametersList.INSTRUMENT + '-' + pair);
		}	
	});
	
	// For logged out users its enough
	if(!userLoggedIn) return pairs;

	// Add language 
	pairs.push(language);
	
	pairs.push(language + '-' + culture)
	
	usersPairs.forEach(pair => {
		if(pairs.indexOf(language + '-' + parametersList.INSTRUMENT + '-' + pair) === -1){
			pairs.push(language + '-' + parametersList.INSTRUMENT + '-' + pair);
		}
		if(testEnabled) {
			pairs.push('test' + '-' + parametersList.INSTRUMENT + '-' + pair );
		} 
	})
	return pairs;
}

const getSocketUser = socketId => {
	const socket = io.sockets.connected[socketId];
	const id = getUserId(socket);
	return users[id];
}

const setUserData = (data) => {
	const id = getUserId(data);

	users[id] = Object.assign({}, user, users[id], data);
	users[id][parametersList.PAIRS] = generateUserPairs(data);
	// Handling other sockets can be left for later
	// Because we might want to handle this in the browser. 
	// For example, why would we care about logged out tab. No reason. 
	// Connecting socket should only care about itself, and data it passes
	if(users[id][parametersList.USER_LOGGED_IN]) {
		// If logged in move sockets from machine object to user's object
			
	}

	// Update language parameter on all connections for this machine

}

const setBrowserData = data => {
	const id = getUserId(data);
	const machineHash = data[parametersList.MACHINE_HASH];
	const language = data[parametersList.LANGUAGE];
	let user = users[id];

	let browsers = user[parametersList.BROWSERS].filter(machine => machine[parametersList.MACHINE_HASH] !== machineHash );
	
	browsers.push({
		[parametersList.MACHINE_HASH]: machineHash,
		[parametersList.LANGUAGE]: language,
		[parametersList.PUSH_ENABLED]: false,
	});

	user[parametersList.BROWSERS] = [...browsers];
}

const addSocketConnection = (data) => {
	const id = getUserId(data);;
	const user = users[id]
	let sockets = [];
	
	users[id][parametersList.SOCKETS].forEach(socket => {
		socket[parametersList.SOCKET_ACTIVE] = false;
	})
	
	// Making sure we avoid duplicates. We only want to modify the socket with give id
	sockets = users[id][parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== data[parametersList.SOCKET_ID]);
	
	sockets.push({
		[parametersList.SOCKET_ID]: data[parametersList.SOCKET_ID],
		[parametersList.LANGUAGE]: data[parametersList.LANGUAGE],
		[parametersList.MACHINE_HASH]: data[parametersList.MACHINE_HASH],
		[parametersList.SOCKET_ACTIVE]: true
	})
	
	users[id][parametersList.SOCKETS] = [...sockets];
	
	// Add user's reference to socket	
	const socket = io.sockets.connected[data[parametersList.SOCKET_ID]];
	socket[parametersList.MACHINE_HASH] = data[parametersList.MACHINE_HASH];
	socket[parametersList.USER_ID] = data[parametersList.USER_ID];
	
	joinRooms(socket, user[parametersList.PAIRS]);
	
}
/*
 * Push Notification Subscription function. 
 * 
 * It recieves push registration data from the client
 * and updates users object. It adds data to users.push object, 
 * update sockets. 
 *
 * @param object data. Subscription data
 * @return void
 */
const pushSubscribe = data => {
	console.log('We are registering push notifications');
	const id = getUserId(data);
	let user = users[id];
	let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== data[parametersList.TOKEN]);
	let browserData = user[parametersList.PUSH].filter(browser => push[parametersList.MACHINE_HASH] !== data[parametersList.MACHINE_HASH]);

	pushData.push({
		[parametersList.MACHINE_HASH]: data[parametersList.MACHINE_HASH],
		[parametersList.TOKEN]: data[parametersList.TOKEN],
		[parametersList.LANGUAGE]: data[parametersList.LANGUAGE],
		[parametersList.PUSH_ACTIVE]: true
	})
	
	browserData.push({
		[parametersList.MACHINE_HASH]: data[parametersList.MACHINE_HASH],
		[parametersList.LANGUAGE]: data[parametersList.LANGUAGE],
		[parametersList.PUSH_ENABLED]: true
	})

	user[parametersList.PUSH] = [...pushData];
	user[parametersList.BROWSERS] = [...browserData];
}

/*
 * Push Notification Unsubscription function. 
 * 
 * It removes push notification reigstration from the users object 
 *
 * @param object data. Subscription data
 * @return void
 */
const pushUnsubscribe = data => {
	const id = getUserId(data);
	let user = users[id];
	
	let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== data[parametersList.TOKEN]);
	
	user[parametersList.PUSH].map(browser => {
		if(push[parametersList.MACHINE_HASH] === data[parametersList.MACHINE_HASH]){
			push[parametersList.PUSH_ENABLED] = false;
		}
	});

	user[parametersList.PUSH] = [...pushData];
}





const socketDisconnect = data => {
	const id = data[parametersList.USER_ID] || data[parametersList.MACHINE_HASH];
	const user = users[id];
	const socketId = data[parametersList.SOCKET_ID];

	user[parametersList.SOCKETS] = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== socketId);
}

/*
 * Tab visibility handler. Used to switch alerts channel from push notification
 * and socket based messages based on tab's visibility
 *
 * @param object data. Object with machineHash, and userId
 * @return void
 */
const browserTabVisibilityHandler = data => {
	const socket = io.sockets.connected[data[parametersList.SOCKET_ID]];

}
module.exports = {
	init,
	checkIfUserExists,
	setUserData,
	addSocketConnection,
	socketDisconnect,
	setBrowserData,
	pushSubscribe,
	pushUnsubscribe,
	browserTabVisibilityHandler,
	getUsers
}