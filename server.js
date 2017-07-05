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
const connections = require('./lib/connections');

const marketAlerts = new connections(http, app, parametersList);
const webeyezRedis = new connections(http, app);

const marketAlertsConfig = require('./app/config');
const usersManagement = require('./app/usersManagement');

var mongoose = require('mongoose');
var dbName = marketAlertsConfig.db.name;
var connectionString = marketAlertsConfig.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

const serverIdGenerator = require('./app/marketAlerts/utils/serverIdGenerator');

serverIdGenerator()
	.then(serverSettings => {
		
		usersManagement.setServerId(serverSettings[parametersList.SERVER_ID]);

		marketAlerts.init({
			name: 'Market Alerts',
			serverID: serverSettings[parametersList.SERVER_ID],
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

		
		webeyezRedis.init({
			name: 'Webeyez Redis',
			serverID: serverSettings[parametersList.SERVER_ID],
			useMssql: false,
			/*redis: {
				host: marketAlertsConfig.webeyezRedisHost,
				port: marketAlertsConfig.webeyezRedisPort
			},*/
		})
		
	}).catch(err => {
		console.error((`There was an error while generating serverID. Server will not handle requests`));
		console.log(err);
	})

require('./app/marketAlerts')(marketAlerts, usersManagement);

const port = 3031;

http.listen(port, () => {
	console.log(`Server listening on port ${port}`.magenta.bold.bgWhite);
})


