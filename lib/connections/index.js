"use strict";

// than manage users. 
const socketManagement = require('./socketManagement');
const routesManagement = require('./routesManagement');
const redisManagement = require('./redisManagement');
const events = require('./events');
let sql = require('mssql');


module.exports  = (http, app, parametersList) => {
	const init = (options) => {
			
		const appName = options.name || '';
						
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
			socketManagement.handleSocketConnections(options, http, events, parametersList);
		}				
		if(options.redis){
			// Initialize redis
			redisManagement.init(options, events);
		}
		
		// Start routes management
		routesManagement.addRoutes(options, app, events);
		
		console.log(`App [${appName}] initialization complete. `);

		return 'success';
			
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