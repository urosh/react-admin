"use strict";
const parametersList = require('./parameterList').parameterList;
const messageChannels = require('./parameterList').messageChannels;


const socketConnection = {
	[parametersList.SOCKET_ID]: '',
	[parametersList.SOCKET_ACTIVE]: '',
	[parametersList.LANGUAGE]: '',
};

const pushConnection = {
	token: '',
	pushEnabled: false,
	language: 'en',

}
const connections = {
	sockets: [],
	push: [],
	mobile: []
};

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
	connections: Object.assign({}, connections)
}

let users = [];
const getLoggedOutBrowserUser = (machineHash) => {
	let user = {};

	if(users[machineHash] && users[machineHash])
}

const getUsersSockets = (id) => {
	if(!users[id]) return [];
	return [...users[id].connections.sockets];
}

const checkIfUsersExists = id => {
	return users[id];
}

const checkIfSocketExists = (id, socketID) => {
	let index = -1;

	users[id].connections.sockets.forEach((socket, i) => {
		if(socketID === socket[parametersList.SOCKET_ID]) {
			index = i;
		} 
	});

	return index;
} 

const addSocketConnection = (id, connectionData) => {

}
const loggedOutUserBrowserConnect = (data) => {
	if(
		!data || 
		!data[parametersList.MACHINE_HASH]   ||
		!data[parametersList.SOCKET_ID]   ||
		(typeof data[parametersList.USER_LOGGED_IN] === 'undefined') ||
		data[parametersList.USER_LOGGED_IN] 
	) {
		return -1;
	}
	
	let usersData = Object.assign({}, user, data);
	//let usersConnections = getUsersSockets(data[parametersList.MACHINE_HASH]);
	usersData.connection = addSocketConnection(id, connectionData);

	if(checkIfUsersExists(data[parametersList.MACHINE_HASH])){
		// Update connections
		
	}else{
		usersSockets = usersSockets.concat({
			data[parametersList.SOCKET_ID],
			data[parametersList.SOCKET_ACTIVE]: true,
			data[parametersList.LANGUAGE],
		});
		usersData.connections.sockets = usersSockets;
	}
	
	let connection = Object.assign({}, socketConnection, data );
	data[parametersList.MACHINE_HASH].connections.sockets.push(connection)
	return data[parametersList.MACHINE_HASH];
}
const loggedOutUserPushConnect = (data) => {

}

const loggedOutUserMobileConnect = (data) => {

}

const loggedInUserBrowserConnect = (data) => {

}

const loggedInPushConnect = (data) => {

}

const loggedInMobileConnect = (data) => {

}

const getUsers = () => users;

const getLoggedOutBrowserUser = (machineHash) => {

}

const getLoggedOutBrowserUsers = () => {

}

const getLoggedOutMobileUser = (token) => {

}

const getLoggedOutMobileUsers = () => {

}
const connect = (data, channel) => {
	if(!data || !data[parametersList.USER_LOGGED_IN] || !data[parametersList.MACHINE_HASH] || !data[parametersList.USER_ID]) return -1;

}
module.exports = {
	getUsers,
	getLoggedOutBrowserUser,
	getLoggedOutBrowserUsers,
	getLoggedOutMobileUser,
	getLoggedOutMobileUsers,
	loggedOutUserBrowserConnect,

}