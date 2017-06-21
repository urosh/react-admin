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

const marketAlerts = require('./lib/marketAlerts')(http);
const usersManagement = marketAlerts.usersManagement;

app.use(bodyParser.json());
app.use(cors());

// Just for testing purposes
app.get('/test', (req, res) => {
	res.send(usersManagement.getUsers());
})

// Loged in user socket connection
marketAlerts.addEvent('connectUser', 
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
		if(usersManagement.checkIfUserExists(data[parametersList.USER_ID])){
			usersManagement.setUserData(data);
			usersManagement.addSocketConnection(data);
			usersManagement.setBrowserData(data);
		}else{
			usersManagement.setUserData(data);
			usersManagement.addSocketConnection(data);
			usersManagement.setBrowserData(data);
		}
		// 
		// get users 
		// add/update data
		// add/update sockets
		//let newUsersData = usersManagemet.getUser(data)
		/*usersManagemet.loggedOutUserBrowserConnect(data, messageChannels.BROWSER)*/
	}
);
// Logged out user socket connection
marketAlerts.addEvent(
	'connectVisitor', 
	config.eventChannels.SOCKETS, 
	[
		parametersList.MACHINE_HASH,
		parametersList.TEST_ENABLED,
		parametersList.LANGUAGE
	], 
	function(data){
		/*marketAlerts.connect(data, messageChannels.BROWSER)*/
		//console.log('Logged out user connected');
		usersManagement.setUserData(data);
		usersManagement.addSocketConnection(data);
		usersManagement.setBrowserData(data);

	}
)

// Closing socket connection
marketAlerts.addEvent(
	'disconnect', 
	config.eventChannels.SOCKETS, 
	[], 
	function(data){
		usersManagement.socketDisconnect(data);
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
		usersManagement.pushSubscribe(data);
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
		usersManagement.pushUnsubscribe(data);
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
		usersManagement.browserTabVisibilityHandler(data);
	}
)

// Browser tab active event handler
marketAlerts.addEvent(
	'alertsSubscriptionChange',
	config.eventChannels.SOCKETS,
	[
		parametersList.USER_ID,
		parametersList.MACHINE_HASH,
		parametersList.MARKET_ALERT_ALLOW
	],
	function(data) {
		usersManagement.browserTabVisibilityHandler(data);
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
		usersManagement.updateInstrument(data);
	}
)




marketAlerts.init({
	socketOrigins: config.socketOrigins
});

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})