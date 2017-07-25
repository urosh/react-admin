/*
 * Client messaging server v2. 
 * 
 * The application consists of connections library and events that are added
 * using the library's api. Connection library connects different input
 * channels over which the server is receiving information from the outside
 * world. 
 * 
 * Currently there are three channels: Sockets, Redis, Http.The library
 * itself is quite small and simple. Communication with the library is done
 * using the events api, that allows user to add events to the system. In that
 * way building the application consist of adding various events and providing 
 * handlers for these events using the events api. In our implementation we 
 * are adding these events in the app module using number of connections 
 * instances.
 *
 * Clients module adds events for handling clients connections (browsers, 
 * mobile and push registrations and handling)
 *
 * Direct messaging module adds events for handling notification admin panel 
 * (Admin socket connections, message previews, user stats)
 *
 * Market alert module adds events for market alerts handling. Receiving market 
 * alert triggers, transforming it to appropriate formats and sending it to
 * clients over different channels (browser push, mobile push, html alert)
 *
 * Webeyez redis module handles user profile updates from received from 
 * webeyez.
 *
 * User management module is independent module that stores user’s data and 
 * provide various methods for manipulating this data.  These methods are 
 * used by any module that is modifying the state of user profiles.
 *
 * 
 */
 
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
const clients = new Connections(http, app, parameters);

const marketAlertsConfig = require('./app/config');
const Users = require('./app/usersManagement');
const usersManagement = new Users();

const mongoose = require('mongoose');
const dbName = marketAlertsConfig.db.name;
const connectionString = marketAlertsConfig.db.connection + dbName;

const serverIdGenerator = require('./app/serverIdGenerator');

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
		
		let clientIo = socketIO(http, {
			origins: marketAlertsConfig.socketOrigins,
			path: '/live/socket.io'
		});

		let adminIo = socketIO(http, {
			origins: 'lcl.live.new.com:*',
			path: '/admin/socket.io'
		});

		marketAlerts.init({
			name: 'Market Alerts',
			serverID: serverSettings[parameters.general.SERVER_ID],
			useMssql: false,
			socket: {
				io: clientIo
			},
			redis: {
				sentinels: marketAlertsConfig.sentinels,
				name: 'redis-cluster'
			}
		});
		
		
		clients.init({
			name: 'Clients',
			serverID: serverSettings[parameters.general.SERVER_ID],
			useMssql: true,
			socket: {
				io: clientIo
			},
			redis: {
				sentinels: marketAlertsConfig.sentinels,
				name: 'redis-cluster'
			},
			mssql: {
				host: marketAlertsConfig.mssqlHost
			}
		})

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
				io: adminIo
			},
			redis: {
				sentinels: marketAlertsConfig.sentinels,
				name: 'redis-cluster'
			}
		});

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

require('./app/clients')(clients, usersManagement);

const port = 3031;

http.listen(port, () => {
	console.log(`Server listening on port ${port}`.magenta.bold.bgWhite);
})


