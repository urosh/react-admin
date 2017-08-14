/*
 * Connections module
 * 
 * The module serves as a bridge between different input channels. It makes it 
 * easier for users to add and handle events. It provides api for adding 
 * events. 
 * 
 * Currently we are handling three data channels: Sockets, Http and Redis. 
 * 
 * Each channel is handled by its own channel handling module. 
 *
 */
"use strict";

// than manage users. 
const _ = require('lodash');
let sql = require('mssql');

module.exports = function(app, parameters, http) {
	// Events module for storing and handling events in general way	
	const events = new (require('./events'))();
	// Adding event channels
	const socketManagement = new (require('./socketManagement'))();
	const routesManagement = new (require('./routesManagement'))();
	const redisManagement = new (require('./redisManagement'))();
	
	let appName;
	/*
	 * Connections init function. 
	 * 
	 * Used to kick of the library by passing the 
	 * object with connections info. 
	 * 
	 * @param object 
	 * @return void
	 *
	 */
	const init = (options) => {
		appName = options.name || '';
		
		socketManagement.init(options, events, parameters);
		
		redisManagement.init(options, events);
		
		// Start routes management
		routesManagement.init(options, app, events);
		
		console.log(`[${appName}] initialization complete. `);

		return 'success';
	}
	
	// Api methods for handling various event types

	const addSocketInEvent = (name, data, handler) => {
		events.addEvent(name, 'in', 'sockets', data, handler);
	}

	const addSocketOutEvent = (name, data) => {
		events.addEvent(name, 'out', 'sockets', data, handler);
	}

	const addPushOutEvent = (name, data) => {
		events.addEvent(name, 'out', 'push', data, handler);
	}

	const addHttpInEvent = (name, data, handler, method, url) => {
		events.addEvent(name, 'in', 'http', data, handler, method, url );
	} 

	const addHttpOutEvent = (name, data, url) => {
		events.addEvent(name, 'out', 'http', data, handler);
	}

	const addRedisInEvent = (name, data, handler) => {
		events.addEvent(name, 'in', 'redis', data, handler);
	}

	const getSocketsConnection = () => socketManagement.getIo();
	
	const getRedisConnection = () => redisManagement.getRedis();
	
	return {
		init,
		addSocketInEvent,
		addSocketOutEvent,
		addPushOutEvent,
		addHttpInEvent,
		addHttpOutEvent,
		addRedisInEvent,
		getSocketsConnection,
		getRedisConnection
	}
	
};
