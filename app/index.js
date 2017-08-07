/*
 * Starting up our notifications server
 * 
 * The server is using socket, redis and http connections. We need to 
 * create this connections and pass them to individual modules. The idea
 * is to have different modules handle different areas of concern. Theorethically we could 
 * define all events in a single module. This is up to the user how the code will be organized
 * at this point. 
 * 
 * The modules are doing notthing more than adding events. 
 * 
 * Before starting with events adding we need to create redis and socket connections. 
 * 
 * Once we connect to desired channels we can go on and kick of modules, that will start 
 * listening for the events. 
 * 
 */
"use strict";
const marketAlertsConfig = require('./config');
const parameters = require('./parameters');

const Redis = require('ioredis');
const socketIO = require('socket.io');

const session = require('express-session');
const RedisStore = require('connect-redis')(session);


const mongoose = require('mongoose');
const dbName = marketAlertsConfig.db.name;
const connectionString = marketAlertsConfig.db.connection + dbName;
mongoose.Promise = require('bluebird');
mongoose.connect(connectionString);

const Users = require('./usersManagement');
const usersManagement = new Users();


// Our connection library 
const Connections = require('../lib/connections');


module.exports = (app, http) => {
/*
 * Connections instances. Each instance is adding events for specific
 * group of tasks. Connections library recieves app instance and the list of
 * parameters that we are planning to use in our handlers. 
 */
// Receiving market alert triggers and sending messages to the client
const marketAlerts = new Connections(app, parameters);
// Handling user updates 
const userUpdates = new Connections(app, null);
// Admin panel handling
const directMessaging = new Connections(app, parameters);
// User connections (browser, push, mobiles)
const clients = new Connections(app, parameters);

const serverIdGenerator = require('./serverIdGenerator');


// Start socket and redis connections
// Socket connection used to communicate to the clients
let clientIo = socketIO(http, {
	origins: marketAlertsConfig.socketOrigins,
	path: '/live/socket.io'
});

// Socket connection used to communicate to the admin panel
let adminIo = socketIO(http, {
	origins: 'lcl.live.new.com:*',
	path: '/admin/socket.io'
});

// Local redis used to publish events and data over redis
let pub = new Redis({
	sentinels: marketAlertsConfig.sentinels,
	name: 'redis-cluster'
});

let pubRedisError = false;
pub.on("error", function(err) {
    if (!pubRedisError) {
        pubRedisError = true;
        console.error(`Redis Error: Error connecting to Pub Redis`, err);
    }
});

let pubRedisConnected = false;
pub.on('connect', err => {
	if(!pubRedisConnected) {
		pubRedisConnected = true;
		console.log(`Redis: Pub redis connected.`)
	}
})

// Local redis instance used to listen for events
let sub = new Redis({
	sentinels: marketAlertsConfig.sentinels,
	name: 'redis-cluster'
});

let subConnectionError = false;
sub.on("error", function(err) {
    if (!subConnectionError) {
        subConnectionError = true;
        console.error(`Redis Error: Error connecting to Sub redis`, err);
    }
});

let subRedisConnected = false;
sub.on('connect', err => {
	if(!subRedisConnected) {
		subRedisConnected = true;
		console.log(`Redis: Sub redis connected.`)
	}
})

// Webeyez redis, used to receive updates from webeyez when the user profile changes
let webeyezRedis = new Redis({
	host: marketAlertsConfig.webeyezRedisHost,
	port: marketAlertsConfig.webeyezRedisPort
});

let webeyezRedisConnected = false;
webeyezRedis.on('connect', err => {
	if(!webeyezRedisConnected) {
		webeyezRedisConnected = true;
		console.log(`Redis: WebeyezRedis redis connected.`)
	}
})

let webeyezConnectionError = false;
webeyezRedis.on("error", function(err) {
    if (!webeyezConnectionError) {
        webeyezConnectionError = true;
        console.error(`Redis Error: Error connecting to WebeyezRedis Redis`, err);
    }
});

/*
 * Adding event listeners. This is done before kicking off the individual modules. Once 
 * event listeners are in place, we start generating serverID, and then starting to 
 * listen for the events. 
 *  
 */

// Implementation of market alerts
require('./marketAlerts')(marketAlerts, usersManagement);
// Connecting to webeyez redis and updating user subscriptions
require('./userUpdates')(userUpdates, usersManagement);
// Adding direct messaging module and  admin panel 
require('./directMessaging')(directMessaging, usersManagement);
// Adding clients module
require('./clients')(clients, usersManagement);


// After server id is generated we kick off the things
serverIdGenerator()
	.then(serverSettings => {
		// Starting the user management module. It loads data from the database
		usersManagement.init();
		
		/*
		 * Passing the server id to the usersManagement module. We need to keep
		 * track of which server is used to register the user in order to be 
		 * able to serve users correctly. 
		 */
		usersManagement.setServerId(serverSettings[parameters.general.SERVER_ID]);

		/*
		 * Connections instance initialization. Init function receives 
		 * object with following parameters: 
		 * name String 
		 * serverID String
		 * useMssql Boolean Flag that says wheter we are planning to use mssql
		 * socket Object with io parameter that passes socket connection
		 * redis Object with redis connection information
		 * mssql Object with mssql connection information
		 *  
		 */
		
		// Initialize session for admin panel
		app.use(session({
			store: new RedisStore({
				client: pub 
			}),
			secret: 'ii7Aighie5ph',
			resave: false,
			saveUninitialized : false,
			cookie: {maxAge: 1800000 }
		}));

		// Market alerts are using client socket connections and redis 
		marketAlerts.init({
			name: 'Market Alerts',
			serverID: serverSettings[parameters.general.SERVER_ID],
			socket: clientIo,
			redis: {
				pub,
				sub
			}
		});
		
		// Clients are using client socket connections, redis and mssql
		clients.init({
			name: 'Clients',
			serverID: serverSettings[parameters.general.SERVER_ID],
			socket: clientIo,
			redis: {
				pub,
				sub
			},
		})
		
		// Webeyez redis is only using webeyez redis connection
		userUpdates.init({
			name: 'User updates',
			serverID: serverSettings[parameters.general.SERVER_ID],
			redis: {
				sub: webeyezRedis},
		});
		
		// Admin panel is using admin socket and redis
		directMessaging.init({
			name: 'Direct Messaging',
			serverID: serverSettings[parameters.general.SERVER_ID],
			socket: adminIo,
			redis: {
				pub,
				sub
			}
		});

	}).catch(err => {
		console.error((`There was an error while generating serverID. Server will not handle requests`));
		console.log(err);
	})
	


}