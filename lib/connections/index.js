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

	//const addSocketInEvent = (name, data, handler, distributed) => {
	
	const addSocketInEvent = (event) => {
		if(!event.name) {
			console.log(`Event registration error: Missing event name`, event);
			return;
		}

		if(!event.handler) {
			console.log(`Event registration error: ${event.name} Missing event handler`);
			return;
		}
		

		if(!event.data) event.data = [];
			
		if(!Array.isArray(event.data)) {
			console.log(`Event registration error: ${event.name} Provided data parameters is not an array`);
			return;
		}
			
		if(typeof event.handler !== 'function') {
			console.log(`Event registration error: ${event.name} Provided handler is not a function`);
			return;
			
		};
		
		event.channel = 'sockets';
		event.direction = 'in';
		event.distributed = event.distributed ? true: false;

		events.addEvent(event);
		
	}

	//const addSocketOutEvent = (name, data) => {
	const addSocketOutEvent = (event) => {
		if(!event.name) {
			console.log(`Event registration error: Missing event name`, event);
			return;
		}

		if(!event.handler) {
			console.log(`Event registration error: ${event.name} Missing event handler`);
			return;
		}

		if(!event.data) event.data = [];

		if(!Array.isArray(event.data)) {
			console.log(`Event registration error: ${event.name} Provided data parameters is not an array`);
			return;
		}
			
		if(typeof event.handler !== 'function') {
			console.log(`Event registration error: ${event.name} Provided handler is not a function`);
			return;
			
		};

		event.direction = 'out';
		event.channel = 'sockets';

		events.addEvent(event);
	}

	//const addPushOutEvent = (name, data) => {
	const addPushOutEvent = (event) => {
		if(!event.name) {
			console.log(`Event registration error: Missing event name`, event);
			return;
		}

		if(!event.handler) {
			console.log(`Event registration error: ${event.name} Missing event handler`);
			return;
		}
		
		if(!event.data) event.data = [];

		if(!Array.isArray(event.data)) {
			console.log(`Event registration error: ${event.name} Provided data parameters is not an array`);
			return;
		}
			
		if(typeof event.handler !== 'function') {
			console.log(`Event registration error: ${event.name} Provided handler is not a function`);
			return;
			
		};

		event.direction = 'out';
		event.channel = 'push';

		events.addEvent(event);
	}

	//const addHttpInEvent = (name, data, handler, method, url, distributed) => {
	const addHttpInEvent = (event) => {
		
		if(!event.name) {
			console.log(`Event registration error: Missing event name`, event);
			return;
		}

		if(!event.handler) {
			console.log(`Event registration error: ${event.name} Missing event handler`);
			return;
		}

		if(!event.method) {
			console.log(`Event registration error: ${event.name} Missing method`);
			return;
		}

		if(!event.url) {
			console.log(`Event registration error: ${event.name} Missing url`);
			return;
		}
				
		if(!event.data) event.data = [];

		if(!Array.isArray(event.data)) {
			console.log(`Event registration error: ${event.name} Provided data parameters is not an array`);
			return;
		}
			
		if(typeof event.handler !== 'function') {
			console.log(`Event registration error: ${event.name} Provided handler is not a function`);
			return;
			
		};

		event.direction = 'in';
		event.channel = 'http';
		event.distributed = event.distributed ? true: false;
		
		events.addEvent(event);
	} 

	//const addHttpOutEvent = (name, data, url) => {
	const addHttpOutEvent = (event) => {
		if(!event.name || !event.data || !event.url || !event.handler) return;
		
		if(typeof event.handler !== 'function') return -1;
		
		if(!event.data) event.data = [];
		
		if(!Array.isArray(event.data)) return -1;
		
		event.direction = 'out';
		event.channel = 'http';

		events.addEvent(event);
	}

	//const addRedisInEvent = (name, data, handler) => {
	const addRedisInEvent = (event) => {
		if(!event.name) {
			console.log(`Event registration error: Missing event name`, event);
			return;
		}

		if(!event.handler) {
			console.log(`Event registration error: ${event.name} Missing event handler`);
			return;
		}
		

		if(!event.data) event.data = [];
			
		if(!Array.isArray(event.data)) {
			console.log(`Event registration error: ${event.name} Provided data parameters is not an array`);
			return;
		}
			
		if(typeof event.handler !== 'function') {
			console.log(`Event registration error: ${event.name} Provided handler is not a function`);
			return;
			
		};
				
		event.direction = 'in';
		event.channel = 'redis';
		event.distributed = event.distributed ? true: false;
		
		events.addEvent(event);
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
