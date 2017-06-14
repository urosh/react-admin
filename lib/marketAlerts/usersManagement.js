"use strict";
const parametersList = require('./parameterList').parameterList;
const messageChannels = require('./parameterList').messageChannels;
const globalPairs = require('../../config').globalPairs;

const socketConnection = {
	[parametersList.SOCKET_ID]: '',
	[parametersList.SOCKET_ACTIVE]: '',
	[parametersList.LANGUAGE]: '',
};

const browser = {
	[parametersList.MACHINE_HASH]: '',
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: '',
	[parametersList.PUSH_ENABLED]: false
}

const push = {
	[parametersList.MACHINE_HASH]: '',
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: '',
}

const mobile = {
	[parametersList.TOKEN]: '',
	[parametersList.LANGUAGE]: ''
}

const user = {
	[parametersList.USER_ID]: '',
	[parametersList.LANGUAGE]: 'en',
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



const getUsers = () => users;


// UTIL FUNCTIONS 
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
		pairs.push(language + '-' + pair);
		if(testEnabled){
			pairs.push('test-' + language + '-' + pair);
		}	
	});
	
	// For logged out users its enough
	if(!userLoggedIn) return pairs;

	// Add language 
	pairs.push(language);
	
	pairs.push(language + '-' + culture)
	
	usersPairs.forEach(pair => {
		if(pairs.indexOf(language + '-' + pair) === -1){
			pairs.push(language + '-' + pair);
		}
		if(testEnabled) {
			pairs.push('test' + '-' + language + '-' + pair );
		} 
	})

}

const findSocketUser = socketId => {
	return Object.keys(id).filter(id => {
		const user = users[id];
		const sockets = user[parametersList.SOCKETS];
		return sockets.indexOf(socketId) > -1;
	});
}
const setUserData = (data) => {
	const userID = data[parametersList.USER_ID];
	const machineHash = data[parametersList.MACHINE_HASH];
	const id = userID || machineHash;

	users[id] = Object.assign({}, user, users[id], data);
	
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
	const machineHash = data[parametersList.MACHINE_HASH];
	const userId = data[parametersList.USER_ID];
	const language = data[parametersList.LANGUAGE];
	
	let user = userId ? users[userId] : users[machineHash] || {};
	let browsers = user[parametersList.BROWSERS].filter(machine => machine[parametersList.MACHINE_HASH] !== machineHash );
	
	browsers.push({
		[parametersList.MACHINE_HASH]: machineHash,
		[parametersList.LANGUAGE]: language,
		[parametersList.PUSH_ENABLED]: false,
	});

	user[parametersList.BROWSERS] = [...browsers];
}

const addSocketConnection = (data) => {
	const id = data[parametersList.USER_ID] || data[parametersList.MACHINE_HASH];
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
		[parametersList.SOCKET_ACTIVE]: true
	})
	
	users[id][parametersList.SOCKETS] = [...sockets];

	console.log(users[id][parametersList.SOCKETS][0]);
}

const socketDisconnect = data => {
	const = socketId = data[parametersList.SOCKET_ID];
	const user = findSocketUser(socketId);
}

module.exports = {
	checkIfUserExists,
	setUserData,
	addSocketConnection,
	socketDisconnect,
	setBrowserData,
	getUsers
}