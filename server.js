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

const parametersList = require('./lib/marketAlerts/parameterList').parameterList;
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

marketAlerts.addEvent('connectUser', 
	config.eventChannels._SOCKETS_, 
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

marketAlerts.addEvent(
	'connectVisitor', 
	config.eventChannels._SOCKETS_, 
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

marketAlerts.addEvent(
	'disconnect', 
	config.eventChannels._SOCKETS_, 
	[], 
	function(data){
		/*marketAlerts.connect(data, messageChannels.BROWSER)*/
		console.log('DISCONNECT');
		console.log(data);

		/*usersManagement.setUserData(data);
		usersManagement.addSocketConnection(data);
		usersManagement.setBrowserData(data);*/

	}
)



marketAlerts.init({
	socketOrigins: config.socketOrigins
});

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})