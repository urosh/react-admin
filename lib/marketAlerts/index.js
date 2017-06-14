"use strict";

// than manage users. 
const socketManagement = require('./socketManagement');
const redisManagement = require('./redisManagement');
const usersManagement = require('./usersManagement');
const socketIO = require('socket.io');
const config = require('../../config');
const events = require('./events');
const serverIdGenerator = require('../../serverIdGenerator');
let sql = require('mssql');
sql.error = true;

sql.connect(config.mssql.host)
	.then(() => {
		sql.error = false;
		console.log(`MSSQL database [${config.mssql.host}] connection established`.green);
	})
	.catch((err) => {
		sql.error = true;
		console.log(`There was an error connecting to the MSSQL database: ${config.mssql.host} `.red + err);
	})

module.exports  = (http) => {
	const init = (options) => {
		
		serverIdGenerator()
			.then((serverSettings) => {
				// Once we have our server id and sql connection ready, we are ready to initalize the modules
				console.info(('Server Initialization: ').yellow + ' Generating server ID [' + serverSettings.serverID + ']');
				
				const io = socketIO(http, {
					origins: config.socketOrigins,
					path: '/live/socket.io'
				});
				// Initial redis
				redisManagement.init(events, serverSettings.serverID);
				// Start sockets management
				socketManagement.handleSocketConnections(io, events, serverSettings.serverID);
			})
			.catch(err => {
				console.error((`There was an error while generating serverID. Server will not handle requests`));
			})	
	}

	const addEvent = (name, channel, data, handler) => {
		events.addEvent(name, channel, data, handler);
	}
	
	
	return {
		init,
		addEvent,
		usersManagement
	}
	
}