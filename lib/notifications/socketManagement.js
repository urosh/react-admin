"use strict";

const config = require('../../config');
const parametersList = require('./parameterList').parametersList;
const Redis = require('ioredis');

const pub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

// Connect to redis
let subConnectionError = false;

const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
			if(current === ''){
			    if (next in data) return '';
			    return next;
			}
			return current;
		}, '') ;
}

const handleSocketConnections = (io, events, serverID) => {
	
	// Get registered socket's events 
	let socketsEvents = events.getEvents(config.eventChannels.SOCKETS);
	
	io.on('connection', (socket) => {
		// Send parametersList, and registered socket events to client	
		socket.emit('connected', {
			parametersList: parametersList,
			serverInEvents: events.getEventNames(config.eventChannels.SOCKETS),
			serverOutEvents: []
		});
		
		socketsEvents.forEach(event => {
			socket.on(event.name, (clientData) => {
				//socket.active = true;
				let data = {};
				let inputValid = true;

				// Adding serverId, and socket.id to the data
				data = Object.assign({}, clientData, {
					[parametersList.SOCKET_ID]: socket.id,
					serverID
				});
				
				const validation = checkRecievedData(event.data, data);
			
				if(validation !== ''){
					console.log(`MA: ${event.name} error. Parameter missing: ${validation}`);
				}else{
					pub.publish(event.name, JSON.stringify(data));
				}
	
			});
		})
	})
}

module.exports = {
	handleSocketConnections
}