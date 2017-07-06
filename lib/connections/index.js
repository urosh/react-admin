"use strict";

// than manage users. 
const _ = require('lodash');
let sql = require('mssql');

module.exports = function(http, app, parametersList) {
	
	const events = new (require('./events'))();
	const socketManagement = new (require('./socketManagement'))();
	const routesManagement = new (require('./routesManagement'))();
	const redisManagement = new (require('./redisManagement'))();
	let appName;
	
	const init = (options) => {
			
		appName = options.name || '';
		
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
		
		console.log(`[${appName}] initialization complete. `);

		return 'success';
			
	}

	function addEvent(name, channel, data, handler, method, url, distributed) {
		events.addEvent(name, channel, data, handler, method, url, distributed);
	}
	
	const getSocketsConnection = () => socketManagement.getIo();
	
	const getRedisConnection = () => redisManagement.getPub();
	
	
	return {
		init,
		addEvent,
		getSocketsConnection,
		getRedisConnection,
	}
	
};
