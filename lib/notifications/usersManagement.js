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

/*
 * API function that gives access to the users object 
 */
const getUsers = () => users;

const getUser = id => users[id];

const getUserModel = () => user;

const getMobileUser = token => {
	return Object.keys(users)
		.map(id => users[id])
		.filter(user => {
			return (user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] === token)).length
		})[0]
}
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
	return data[parametersList.USER_ID] || data[parametersList.MACHINE_HASH] || data[parametersList.TOKEN];
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

const getSocket = socketId => io.sockets.connected[socketId];
/*
 * Helper function that sets correct pair format. It is used as a room for sockets
 * on different languages. 
 * 
 * @param object socket
 * @param string instrument
 * @return array Array of rooms that socket needs to join for a given pair
 *
 */
const setInstrumentFormat = (socket, instrument) => {
	let rooms = [];
	if(instrument.indexOf(parametersList.INSTRUMENT) > -1) {
		rooms.push(socket[parametersList.LANGUAGE] + '-' + instrument);
		if(socket[parametersList.TEST_ENABLED]) {
			rooms.push(parametersList.TEST + '-' + socket[parametersList.LANGUAGE] + '-' + instrument)
		}
	}else{
		rooms.push(instrument);
	}	
	return rooms;
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
	if(!socket || !rooms) return;
	
	let recievedRooms = [];
	let joinRooms = [];
	let leaveRooms = [];
	
	// Transform rooms array to correct format
	rooms.forEach(room => {
		recievedRooms = recievedRooms.concat(setInstrumentFormat(socket, room));
	})
	
	const currentRooms = [...Object.keys(io.sockets.adapter.rooms).filter(pair => pair.indexOf(parametersList.INSTRUMENT) > -1)];
	
	joinRooms = getArrayDifference(recievedRooms, currentRooms);
	leaveRooms = getArrayDifference(currentRooms, recievedRooms);
	
	joinRooms.forEach(room => {
		socket.join(room);
	});

	leaveRooms.forEach(room => {
		socket.leave(room);
	});
		
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
		pairs.push(parametersList.INSTRUMENT + '-' + pair);
	});
	
	// For logged out users its enough
	if(!userLoggedIn) return pairs;

	// Add language 
	pairs.push(language);
	
	pairs.push(language + '-' + culture)
	
	usersPairs.forEach(pair => {
		if(pairs.indexOf(parametersList.INSTRUMENT + '-' + pair) === -1){
			pairs.push(parametersList.INSTRUMENT + '-' + pair);
		}
	})

	return pairs;
}




/*
 * Helper functions to get socket/push/browser object from users object. It is
 * used when we need to modify object record when updating user's data
 * 
 * @param string users id
 * @param string socketId/machineHash
 * @return void
 */

const getSocketObject = (id, socketId) => {
	const user = users[id];
	if(!user) return null;
	return user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] === socketId)[0];
}

const getPushObject = (id, machineHash) => {
	const user = users[id];
	if(!user) return null;
	return user[parametersList.PUSH].filter(machine => machine[parametersList.MACHINE_HASH] === machineHash)[0];
}

const getBrowserObject = (id, machineHash) => {
	const user = users[id];
	if(!user) return null;
	return user[parametersList.BROWSERS].filter(machine => machine[parametersList.MACHINE_HASH] === machineHash)[0];
}

const getMobileObject = (id, token) => {
	const user = users[id];
	if(!user) return null;
	return user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] === token)[0];
}

const getMobileObjectFromToken = token => {
	if (!token) return {};

	return Object.keys(users)
		.map(id => users[id])
		.reduce((prev, current) => {
			if(prev[parametersList.TOKEN]) return prev;
			let res = current[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] === token);
			if(res.length) return res[0];
			return {};
		}, false)
}

const getBrowserObjectFromMachineHash = machineHash => {
	if (!machineHash) return {};

	return Object.keys(users)
		.map(id => users[id])
		.reduce((prev, current) => {
			if(prev[parametersList.MACHINE_HASH]) return prev;
			let res = current[parametersList.BROWSERS].filter(browser => browser.parametersList[MACHINE_HASH] === machineHash);
			if(res.length) return res[0];
			return {};
		}, false)
}

const getSocketObjectFromSocketId = id => {
	if (!id) return {};

	return Object.keys(users)
		.map(id => users[id])
		.reduce((prev, current) => {
			if(prev[parametersList.SOCKET_ID]) return prev;
			let res = current[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] === id);
			if(res.length) return res[0];
			return {};
		}, false)
}

const getSocketUser = socketId => {
	return Object.keys(users)
		.map(id => users[id])
		.reduce((prev, current) => {
			if(prev[parametersList.SOCKET_ID]) return prev;
			let res = current[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] === socketId);
			if(res.length) return current;
			return {};
		}, false)
}

const getPushUsers = instrument => {
	let pushRegistrations = Object.keys(users)
		.map(id => users[id])
		.filter(user => user[parametersList.MARKET_ALERT_ALLOW])
		.filter(user => user[parametersList.PUSH].length > 0)
		.filter(user => user[parametersList.PAIRS].indexOf(parametersList.INSTRUMENT + '-' + instrument) > -1)
		.map(user => user[parametersList.PUSH]);
	let push = [].concat.apply([], pushRegistrations);
	
	return push.filter(push => push[parametersList.PUSH_ACTIVE]);
}

module.exports = {
	init,
	generateUserPairs,
	joinRooms,
	getUser,
	getUserModel,
	getUsers,
	getUserId,
	getMobileUser,
	getMobileObject,
	getMobileObjectFromToken,
	getBrowserObjectFromMachineHash,
	getSocketObjectFromSocketId,
	getPushObject,
	getSocketObject,
	getSocketUser,
	getSocket,
	getPushUsers
}