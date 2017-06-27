"use strict";

// Read .env file if found
require ('dotenv').config({siltent: true});

// Include newrelic if on production
if (process.env.ENVIRONMENT && process.env.ENVIRONMENT == 'production') {
	console.log('Adding NewRelic');
	require('newrelic');
}

const express = require('express');
const app = express();
const http = require('http').Server(app);
const colors = require('colors');
const bodyParser = require('body-parser');
const cors = require('cors');

const parametersList = require('./lib/marketAlerts/parameterList').parametersList;
const messageChannels = require('./lib/marketAlerts/parameterList').messageChannels;
const config = require('./config');

var mongoose = require('mongoose');
var dbName = config.db.name;
var connectionString = config.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

const marketAlerts = require('./lib/marketAlerts')(http, app);
const usersManagement = marketAlerts.usersManagement;

app.use(bodyParser.json());
app.use(cors());

// Just for testing purposes
/*app.get('/test', (req, res) => {
	res.send(usersManagement.getUsers());
})*/

// Loged in user socket connection
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
		const id = usersManagement.getUserId(data);
		const machineHash = data[parametersList.MACHINE_HASH];
		const language = data[parametersList.LANGUAGE];
		let users = usersManagemet.getUsers();
		let user;
		const userModel = usersManagemet.getUserModel();
		let sockets = [];
		let socket = io.sockets.connected[data[parametersList.SOCKET_ID]];
		
		users[id] = Object.assign({}, userModel, users[id], data);
		user = users[id];
		user[parametersList.PAIRS] = usersManagement.generateUserPairs(data);
		user[parametersList.SOCKETS].forEach(socket => {
			socket[parametersList.SOCKET_ACTIVE] = false;
		});
		
		// Making sure we avoid duplicates. We only want to modify the socket with give id
		sockets = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== data[parametersList.SOCKET_ID]);

		sockets.push({
			[parametersList.SOCKET_ID]: data[parametersList.SOCKET_ID],
			[parametersList.LANGUAGE]: data[parametersList.LANGUAGE],
			[parametersList.MACHINE_HASH]: machineHash,
			[parametersList.SOCKET_ACTIVE]: true
		})

		user[parametersList.SOCKETS] = [...sockets];
		
		
	
		// Add user's reference to socket	
		socket[parametersList.MACHINE_HASH] = machineHash;
		socket[parametersList.USER_ID] = data[parametersList.USER_ID];
		socket[parametersList.LANGUAGE] = data[parametersList.LANGUAGE];
		socket[parametersList.TEST_ENABLED] = data[parametersList.TEST_ENABLED];
		
		if(user[parametersList.MARKET_ALERT_ALLOW]){
			usersManagement.joinRooms(socket, user[parametersList.PAIRS]);
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
		parametersList.MACHINE_HASH,
		parametersList.USER_ID
	], 
	function(data){
		const id = usersManagement.getUserId(data);
		const user = usersManagement.getUser(id);
		const socketId = data[parametersList.SOCKET_ID];
		if(user){
			user[parametersList.SOCKETS] = user[parametersList.SOCKETS].filter(socket => socket[parametersList.SOCKET_ID] !== socketId);
		}
	}
)

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
		
		const machineHash = data[parametersList.MACHINE_HASH];
		const language = data[parametersList.LANGUAGE];
		const token = data[parametersList.TOKEN];
		const socket = io.sockets.connected[data[parametersList.SOCKET_ID]];
		
		// Get push data array	
		let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== token);
		
		let browserData = user[parametersList.BROWSERS].filter(browser => browser[parametersList.MACHINE_HASH] !== machineHash);
		
		let socketObject = usersManagement.getSocketObject(id, data[parametersList.SOCKET_ID]);

		pushData.push({
			[parametersList.MACHINE_HASH]: machineHash,
			[parametersList.TOKEN]: token,
			[parametersList.LANGUAGE]: language,
			[parametersList.PUSH_ACTIVE]: user[parametersList.MARKET_ALERT_ALLOW] && !data[parametersList.TAB_ACTIVE]
		})
		
		browserData.push({
			[parametersList.MACHINE_HASH]: machineHash,
			[parametersList.LANGUAGE]: language,
			[parametersList.PUSH_ENABLED]: true
		})
		
		user[parametersList.PUSH] = [...pushData];
		user[parametersList.BROWSERS] = [...browserData];
		
		if(socketObject){
			socketObject[parametersList.SOCKET_ACTIVE] = data[parametersList.TAB_ACTIVE];
		}

		socket[parametersList.SOCKET_ACTIVE] = user[parametersList.MARKET_ALERT_ALLOW] && data[parametersList.TAB_ACTIVE];

		const pairs = (data[parametersList.TAB_ACTIVE] && user[parametersList.MARKET_ALERT_ALLOW] )? user[parametersList.PAIRS] : [];
			
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
		let user = usersManagement.getUsers(id);
		
		let pushData = user[parametersList.PUSH].filter(push => push[parametersList.TOKEN] !== data[parametersList.TOKEN]);
		
		user[parametersList.PUSH].map(browser => {
			if(push[parametersList.MACHINE_HASH] === data[parametersList.MACHINE_HASH]){
				push[parametersList.PUSH_ENABLED] = false;
			}
		});

		user[parametersList.PUSH] = [...pushData];
	}
)

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
		const socket = io.sockets.connected[data[parametersList.SOCKET_ID]];
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

// Browser tab active event handler
marketAlerts.addEvent(
	'updateMarketAlertsSubscription',
	config.eventChannels.SOCKETS,
	[
		parametersList.USER_ID,
		parametersList.MARKET_ALERT_ALLOW
	],
	function(data) {
		usersManagement.updateMarketAlertSubscription(data);
		const id = usersManagement.getUserId(data);
		let  user = usersManagement.getUser(id);
		if(!user) return;

		const marketAlertAllow = data[parametersList.MARKET_ALERT_ALLOW];
		
		// Update user's object
		user[parametersList.MARKET_ALERT_ALLOW] = marketAlertAllow;
		const pairs = marketAlertAllow ? user[parametersList.PAIRS] : [];
		// Tell all sockets to leave rooms
		
		user[parametersList.SOCKETS].forEach(socketData => {
			let socket = io.sockets.connected[socketData.SOCKET_ID];
			joinRooms(socket, pairs);
		})

		// Block push notifications
		user[parametersList.PUSH].map(push => push[parametersList.PUSH_ACTIVE] = marketAlertAllow);

	}
)

// Browser tab active event handler
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
		let user = usersManagement.getUsers(id);
		if (!user) return;

		const instrument = parametersList.INSTRUMENT + '-' + data[parametersList.INSTRUMENT];
		let pairs = user[parametersList.PAIRS].filter(pair => pair !== instrument);
		
		if(data[parametersList.INSTRUMENT_STATUS]) {
			pairs.push(instrument);
		}

		// Update pairs array
		user[parametersList.PAIRS] = [...pairs];
		
		// Join/Leave room 
		user[parametersList.SOCKETS].forEach(socketData => {
			let socket = io.sockets.connected[socketData.SOCKET_ID];
			usersManagement.joinRooms(socket, pairs);
		})
	}
)


marketAlerts.addEvent(
	'/test',
	config.eventChannels.ROUTES,
	[],
	function(req, res) {
		res.send(usersManagement.getUsers());
	},
	'get'
)

// Api methods for retrieving stats about users
marketAlerts.addEvent(
	'/api/fetch/users',
	config.eventChannels.ROUTES,
	[],
	function(req, res) {
		const users = usersManagement.getUsers();
		const loggedInUsers = Object.keys(users)
			.map(id => users[id])
			.filter(user => user[parametersList.USER_ID]);
		res.send(loggedInUsers);
	},
	'get'
)

marketAlerts.addEvent(
	'/api/fetch/push',
	config.eventChannels.ROUTES,
	[],
	function(req, res) {
		const users = usersManagement.getUsers();
		const loggedInUsers = Object.keys(users)
			.map(id => users[id])
			.filter(user => user[parametersList.PUSH].length);
		res.send(loggedInUsers);
	},
	'get'
)


// Mobile App Api methods
marketAlerts.addEvent(
	'mobileConnect',
	config.eventChannels.ROUTES,
	[
		parametersList.USER_ID,
		parametersList.LANGUAGE,
		parametersList.CULTURE,
		parametersList.TOKEN,
		parametersList.SYSTEM,
		parametersList.NOTIFICATION_DELIVERY_METHOD
	],
	function(data) {
		// Mobile registration function
		//usersManagement.addMobileDevice(data);
		const id = usersManagement.getUserId(data);
		const userModel = usersManagement.getUserModel();
		let users = usersManagement.getUsers();

		let user;
		users[id] = Object.assign({}, userModel, users[id]);
		user = users[id];

		user[parametersList.USER_ID] = data[parametersList.USER_ID];

		let mobiles = user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] !== data[parametersList.TOKEN] );
		
		// Remove all references to the current mobile device
		Object.keys(users)
			.map(id => users[id])
			.map(user => {
				user[parametersList.MOBILES] = user[parametersList.MOBILES].filter(mobile => {
					mobile[parametersList.TOKEN] !== data[parametersList.TOKEN];
				});
			});

		mobiles.push(data);
		user[parametersList.MOBILES] = [...mobiles];

	},
	'post',
	'/devices/mobile/connect'
)

marketAlerts.addEvent(
	'mobileLogout',
	config.eventChannels.ROUTES,
	[
		parametersList.TOKEN,
		parametersList.USER_ID,
	],
	function(data) {
		// Mobile registration function
		//usersManagement.mobileLogout(data);
		let mobileData;
		let users = usersManagement.getUsers();
		let mobileObject = usersManagement.getMobileObject(data[parametersList.USER_ID], data[parametersList.TOKEN]);
		mobileObject[parametersList.USER_ID] = null;
		

		/*Object.keys(users)
			.map(id => users[id])
			.map(user => {
				user[parametersList.MOBILES] = 
					user[parametersList.MOBILES]
						.filter(mobile => {
							if(mobile[parametersList.TOKEN] === data[parametersList.TOKEN]){
								mobile[parametersList.USER_ID] = null;
								mobileData = mobile;
							}
							return mobile[parametersList.TOKEN] !== data[parametersList.TOKEN]
						})
			})*/
	


	},
	'post',
	'/devices/mobile/logout'
)

marketAlerts.addEvent(
	'mobileTokenUpdate',
	config.eventChannels.ROUTES,
	[
		parametersList.OLD_TOKEN,
		parametersList.NEW_TOKEN,
	],
	function(data) {
		// Mobile registration function
		const oldToken = data[parametersList.OLD_TOKEN];
		const newToken = data[parametersList.NEW_TOKEN];
		let users = usersManagement.getUsers();
		let user = usersManagement.getMobileUser(oldToken);
		let oldId = user[parametersList.USER_ID] ? user[parametersList.USER_ID] : oldToken;
		let newId = user[parametersList.USER_ID] ? user[parametersList.USER_ID] : newToken;
		let mobileObject = usersManagement.getMobileObject(newToken, oldToken);
		
		users[newId] = Object.assign({}, users[oldId]);
		mobileObject[parametersList.TOKEN] = newToken;

		if(!user[parametersList.USER_ID]) {
			delete users[oldToken];
		}

	},
	'post',
	'/devices/mobile/update'
)

marketAlerts.addEvent(
	'mobileDelete',
	config.eventChannels.ROUTES,
	[
		parametersList.TOKEN
	],
	function(data) {
		// Mobile registration function
		const token = data[parametersList.TOKEN];
		let user = usersManagement.getMobileUser(token);
		let users = usersManagement.getUsers();
		const id = user[parametersList.USER_ID] ? user[parametersList.USER_ID] : token;
		user[parametersList.MOBILES] = user[parametersList.MOBILES].filter(mobile => mobile[parametersList.TOKEN] !== token);

	},
	'post',
	'/devices/mobile/delete'
)













marketAlerts.init({
	socketOrigins: config.socketOrigins
});

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})