"use strict";

// than manage users. 
const socketManagement = require('./socketManagement');
const routesManagement = require('./routesManagement');
const redisManagement = require('./redisManagement');
const events = require('./events');
const serverIdGenerator = require('./serverIdGenerator');
let sql = require('mssql');


module.exports  = (http, app, parametersList) => {
	const init = (options) => {
		return serverIdGenerator()
			.then((serverSettings) => {
				// Once we have our server id and sql connection ready, we are ready to initalize the modules
				const appName = options.name || '';
				
				console.info(('Server Initialization for ' + appName + ': ').yellow + ' Generating server ID [' + serverSettings.serverID + ']');
				
				if(options.useMssql){
					sql.error = true;

					sql.connect(options.mssql.host)
						.then(() => {
							sql.error = false;
							console.log(`MSSQL database [${config.mssql.host}] connection established`.green);
						})
						.catch((err) => {
							sql.error = true;
							console.log(`There was an error connecting to the MSSQL database: ${config.mssql.host} `.red + err);
						})
				}

				if(options.socket){
					// Start sockets management
					socketManagement.handleSocketConnections(options, http, events, serverSettings.serverID, parametersList);
				}				
				
				if(options.redis){
					// Initialize redis
					redisManagement.init(options, events, serverSettings.serverID);
				}
				// Start routes management
				routesManagement.addRoutes(options, app, events, serverSettings.serverID);

				return 'success';
			})
			.catch(err => {
				console.error((`There was an error while generating serverID. Server will not handle requests`));
				console.log(err);
			})	
	}

	const addEvent = (name, channel, data, handler, method, url) => {
		events.addEvent(name, channel, data, handler, method, url);
	}
	
	const getSocketsConnection = () => socketManagement.getIo();
	
	return {
		init,
		addEvent,
		getSocketsConnection
	}
	
}