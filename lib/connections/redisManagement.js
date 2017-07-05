"use strict";

const Redis = require('ioredis');



module.exports = function(){
	// Connect to redis
	let subConnectionError = false;
	let pub;
	let processingServerID; 
	// Go through event list and subscribe to events
	const init = (options, events) => {
		
		pub = new Redis(options.redis);
		processingServerID =  options.serverID;
		const sub = new Redis(options.redis);
			
		const socketEvents = events.getEvents('sockets');
		
		const routesEvents = events.getEvents('routes').filter(event => event.method === 'post');

		sub.on("error", function(err) {
		    if (!subConnectionError) {
		        subConnectionError = true;
		        console.error(`Redis Error: Error connecting to Redis`, err);
		    }
		});

		let registeredEvents = socketEvents.concat(routesEvents);
		
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