"use strict";

// than manage users. 
const socketManagement = require('./socketManagement');
const routesManagement = require('./routesManagement');
const redisManagement = require('./redisManagement');
const usersManagement = require('./usersManagement');
const parametersList = require('./parameterList').parametersList;
const messageChannels = require('./parameterList').messageChannels;

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

module.exports  = (http, app) => {
	const init = (options, io) => {
		
		serverIdGenerator()
			.then((serverSettings) => {
				// Once we have our server id and sql connection ready, we are ready to initalize the modules
				console.info(('Server Initialization: ').yellow + ' Generating server ID [' + serverSettings.serverID + ']');
				
				
				// Initial redis
				redisManagement.init(events, serverSettings.serverID);
				// Initialize users management
				usersManagement.init(io);
				// Start sockets management
				socketManagement.handleSocketConnections(io, events, serverSettings.serverID);
				routesManagement.addRoutes(app, events, serverSettings.serverID);
			})
			.catch(err => {
				console.error((`There was an error while generating serverID. Server will not handle requests`));
				console.log(err);
			})	
	}

	const addEvent = (name, channel, data, handler, method, url) => {
		events.addEvent(name, channel, data, handler, method, url);
	}
	
	const getParametersList = () => parametersList;
	const getMessageChannels = () => messageChannels;
	
	return {
		init,
		addEvent,
		usersManagement,
		getParametersList,
		getMessageChannels
	}
	
}