"use strict";

const Redis = require('ioredis');



module.exports = function(){
	// Connect to redis
	let subConnectionError = false;
	let redisConnected;
	let pub;
	let processingServerID; 
	// Go through event list and subscribe to events
	const init = (options, events) => {
		
		pub = new Redis(options.redis);
		processingServerID =  options.serverID;
		const sub = new Redis(options.redis);
			
		const socketEvents = events.getEvents('sockets').filter(event => event.distributed);

		
		const routesEvents = events.getEvents('http').filter(event => event.method === 'post');
		
		const redisEvents = events.getEvents('redis');

		sub.on("error", function(err) {
		    if (!subConnectionError) {
		        subConnectionError = true;
		        console.error(`Redis Error: Error connecting to Redis`, err);
		    }
		});
		
		sub.on('connect', err => {
			if(!redisConnected) {
				redisConnected = true;
				console.log(`[${options.name}] redis connected.`)
			}
		})
		
		let registeredEvents = [].concat(socketEvents, routesEvents, redisEvents);
		
		registeredEvents.forEach(event => {
	    	sub.subscribe(event.name);
	    });
		
		
		sub.on('message', (channel, message) => {
			const data = JSON.parse(message);
			data['processingServerID'] = processingServerID;
	    	registeredEvents.forEach(event => {
	    		if(event.name === channel) {
	    			event.handler(data);
	    		}
	    	})
	    })
	}

	const getPub = () => {
		return	pub;
	}

	return {
		init,
		getPub
	}
}