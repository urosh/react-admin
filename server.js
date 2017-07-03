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
var bodyParserJsonError = require('express-body-parser-json-error');
const cors = require('cors');
const socketIO = require('socket.io');



app.use(bodyParser.json());
app.use(bodyParserJsonError());
app.use(cors());

const parametersList = require('./app/config').parametersList;
const marketAlerts = require('./lib/connections')(http, app, parametersList);
const marketAlertsConfig = require('./app/config');
const usersManagement = require('./app/usersManagement');

var mongoose = require('mongoose');
var dbName = marketAlertsConfig.db.name;
var connectionString = marketAlertsConfig.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

marketAlerts.init({
	name: 'Market Alerts',
	useMssql: true,
	socket: {
		origins: marketAlertsConfig.socketOrigins,
		path: '/live/socket.io'
	},
	redis: {
		sentinels: marketAlertsConfig.sentinels,
		name: 'redis-cluster'
	},
	mssql: {
		host: marketAlertsConfig.mssqlHost
	}
})

require('./app/marketAlerts')(marketAlerts, usersManagement);



/*
 * TODO
 * Add some kind of cleaning function that will check when there are no connections
 * left for some user. Then we would delete user's object
 */
marketAlerts.addEvent(
	'/test',
	marketAlertsConfig.eventChannels.ROUTES,
	[],
	function(req, res) {
		res.send(usersManagement.getUsers());
	},
	'get'
)

const webeyezRedis = require('./lib/connections')(http, app);
webeyezRedis.init({
	name: 'webeyezRedis',
	useMssql: false,
	redis: {
		host: marketAlertsConfig.webeyezRedisHost,
		port: marketAlertsConfig.webeyezRedisPort
	},
})

const port = 3031;

http.listen(port, () => {
	console.log(`Server listening on port ${port}`.magenta.bold.bgWhite);
})