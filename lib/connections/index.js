"use strict";

// than manage users. 
const _ = require('lodash');
let sql = require('mssql');

module.exports = function(http, app, parameters) {
	
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
			socketManagement.handleSocketConnections(options, http, events, parameters);
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
	const addSocketInEvent = (name, data, handler, distributed) => {
		events.addEvent(name, 'in', 'sockets', data, handler, distributed);
	}

	const addSocketOutEvent = (name, data) => {
		events.addEvent(name, 'out', 'sockets', data, handler);
	}

	const addPushOutEvent = (name, data) => {
		events.addEvent(name, 'out', 'push', data, handler);
	}

	const addHttpInEvent = (name, data, handler, method, url, distributed) => {
		events.addEvent(name, 'in', 'http', data, handler, distributed, method, url );
	} 

	const addHttpOutEvent = (name, data, url) => {
		events.addEvent(name, 'out', 'http', data, handler);
	}

	const addRedisInEvent = (name, data, handler) => {
		events.addEvent(name, 'in', 'redis', data, handler);
	}

	/*function addEvent(name, channel, data, handler, method, url, distributed) {
		events.addEvent(name, channel, data, handler, distributed, method, url);
	}*/
	
	const getSocketsConnection = () => socketManagement.getIo();
	
	const getRedisConnection = () => redisManagement.getPub();
	
	const getEventsTest = () => {
		console.log(events);
		return	'events.getAllEvents()';
	}

	return {
		init,
		addSocketInEvent,
		addSocketOutEvent,
		addPushOutEvent,
		addHttpInEvent,
		addHttpOutEvent,
		addRedisInEvent,
		getSocketsConnection,
		getRedisConnection,
		getEventsTest
	}
	
};
