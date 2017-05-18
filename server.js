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

const parameterList = require('./lib/marketAlerts/parameterList').parameterList;
const messageChannels = require('./lib/marketAlerts/parameterList').messageChannels;
const config = require('./config');

var mongoose = require('mongoose');
var dbName = config.db.name;
var connectionString = config.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

const marketAlerts = require('./lib/marketAlerts')(http);
const usersManagemet = marketAlerts.usersManagemet;

app.use(bodyParser.json());
app.use(cors());



marketAlerts.addEvent('connectUser', 
	config.eventChannels._SOCKETS_, 
	[
		parameterList.MACHINE_HASH,
		parameterList.USER_ID,
		parameterList.TEST_ENABLED,
		parameterList.MARKET_ALERT_ALLOW,
		parameterList.LANGUAGE,
		parameterList.PAIRS
	], 
	function(data){
		console.log('Logged in user connected');
		usersManagemet.loggedOutUserBrowserConnect(data, messageChannels.BROWSER)
	}
);

marketAlerts.addEvent(
	'connectVisitor', 
	config.eventChannels._SOCKETS_, 
	[
		parameterList.MACHINE_HASH,
		parameterList.TEST_ENABLED,
		parameterList.LANGUAGE
	], 
	function(data){
		marketAlerts.connect(data, messageChannels.BROWSER)
		console.log('Logged out user connected');
	}
)

marketAlerts.init({
	socketOrigins: config.socketOrigins
});

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})