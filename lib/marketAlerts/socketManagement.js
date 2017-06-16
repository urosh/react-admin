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
				
				// Data validation, based on the parameter list provided
				// in event definition. 
				event.data.every(param => {
					if(typeof data[param] === 'undefined') {	
						inputValid = false;
						console.log(`MA: connectUser error. Parameter missing: ${param}`);
						return inputValid; 
					}
					return true;
				});
				
				// Disconnect event is native socket event
				if(event.name === 'disconnect'){
					data[parametersList.MACHINE_HASH] = socket[parametersList.MACHINE_HASH];
					data[parametersList.USER_ID] = socket[parametersList.USER_ID];
				}

				// Send event over redis
				pub.publish(event.name, JSON.stringify(data));
			});
		})
	})
}

module.exports = {
	handleSocketConnections
}