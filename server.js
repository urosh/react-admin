"use strict";

// Read .env file if found
require ('dotenv').config({siltent: true});

// Include newrelic if on production
if (process.env.ENVIRONMENT && process.env.ENVIRONMENT == 'production') {
	console.log('Adding NewRelic');
	require('newrelic');
}

const config = require('./config');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const colors = require('colors');

const bodyParser = require('body-parser');
var bodyParserJsonError = require('express-body-parser-json-error');
const cors = require('cors');

const socketIO = require('socket.io');

var mongoose = require('mongoose');
var dbName = config.db.name;
var connectionString = config.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

const marketAlerts = require('./lib/notifications')(http, app);

const parametersList = marketAlerts.getParametersList();
const messageChannels = marketAlerts.getMessageChannels();
const usersManagement = marketAlerts.usersManagement;

app.use(bodyParser.json());
app.use(bodyParserJsonError());
app.use(cors());

const io = socketIO(http, {
	origins: config.socketOrigins,
	path: '/live/socket.io'
});

marketAlerts.init({
	socketOrigins: config.socketOrigins
}, io);

require('./marketAlerts/browserConnections')(marketAlerts);
require('./marketAlerts/api')(marketAlerts);
require('./marketAlerts/mobileConnections')(marketAlerts);
require('./marketAlerts/pushConnections')(marketAlerts);
require('./marketAlerts/triggers')(marketAlerts);

/*
 * TODO
 * Add some kind of cleaning function that will check when there are no connections
 * left for some user. Then we would delete user's object
 */

marketAlerts.addEvent(
	'/test',
	config.eventChannels.ROUTES,
	[],
	function(req, res) {
		res.send(usersManagement.getUsers());
	},
	'get'
)

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})