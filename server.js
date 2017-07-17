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

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const parameters = require('./app/parameters')
const Connections = require('./lib/connections');

const marketAlerts = new Connections(http, app, parameters);
const webeyezRedis = new Connections(http, app);
const directMessaging = new Connections(http, app, parameters);

const marketAlertsConfig = require('./app/config');
const Users = require('./app/usersManagement');
const usersManagement = new Users();

const mongoose = require('mongoose');
const dbName = marketAlertsConfig.db.name;
const connectionString = marketAlertsConfig.db.connection + dbName;

const serverIdGenerator = require('./app/marketAlerts/utils/serverIdGenerator');

app.use(bodyParser.json());
app.use(bodyParserJsonError());
app.use(cors());
app.set('trust proxy', 1);
		

mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

serverIdGenerator()
	.then(serverSettings => {
		usersManagement.init();

		usersManagement.setServerId(serverSettings[parameters.general.SERVER_ID]);

		marketAlerts.init({
			name: 'Market Alerts',
			serverID: serverSettings[parameters.general.SERVER_ID],
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
		});

		


		app.use('/admin', express.static('public'));
		
		app.use(session({
			store: new RedisStore({
				client: marketAlerts.getRedisConnection() 
			}),
			secret: 'ii7Aighie5ph',
			resave: false,
			saveUninitialized : false,
			cookie: {maxAge: 1800000 }
		}));
		
		
		webeyezRedis.init({
			name: 'Webeyez Redis',
			serverID: serverSettings[parameters.general.SERVER_ID],
			useMssql: false,
			redis: {
				host: marketAlertsConfig.webeyezRedisHost,
				port: marketAlertsConfig.webeyezRedisPort
			},
		});

		directMessaging.init({
			name: 'Direct Messaging',
			serverID: serverSettings[parameters.general.SERVER_ID],
			useMssql: false,
			socket: {
				origins: 'lcl.live.new.com:*',
				path: '/admin/socket.io'
			},
			redis: {
				sentinels: marketAlertsConfig.sentinels,
				name: 'redis-cluster'
			}
		})
		
	}).catch(err => {
		console.error((`There was an error while generating serverID. Server will not handle requests`));
		console.log(err);
	})
// Implementation of market alerts
require('./app/marketAlerts')(marketAlerts, usersManagement);
// Connecting to webeyez redis and updating user subscriptions
require('./app/webeyezRedis')(webeyezRedis, usersManagement);
// Adding direct messaging module and  admin panel 
require('./app/directMessaging')(directMessaging, usersManagement);

const port = 3031;

http.listen(port, () => {
	console.log(`Server listening on port ${port}`.magenta.bold.bgWhite);
})


