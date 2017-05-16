"use strict";

const Redis = require('ioredis');
const config = require('../../config');

const pub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

const sub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

// Connect to redis
let subConnectionError = false;

// Go through event list and subscribe to events
const init = (events, serverID) => {
	const socketEvents = events.getEvents(config.eventChannels._SOCKETS_);
	
	sub.on("error", function(err) {
	    if (!subConnectionError) {
	        subConnectionError = true;
	        console.error(`Redis Error: Error connecting to Redis`, err);
	    }
	});

	socketEvents.forEach(event => {
    	sub.subscribe(event.name);
    });
	
	sub.on('message', (channel, message) => {
    	const data = JSON.parse(message);
    	socketEvents.forEach(event => {
    		if(event.name === channel) {
    			event.handler(data);
    		}
    	})
    })
}

module.exports = {
	init
}