"use strict";

const config = require('../../config');
const parameterList = require('./parameterList');
const Redis = require('ioredis');

const pub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

// Connect to redis
let subConnectionError = false;



const handleSocketConnections = (io, events, serverID) => {
	let socketsEvents = events.getEvents(config.eventChannels._SOCKETS_);
	io.on('connection', (socket) => {
		socket.emit('connected', {
			parameterList: parameterList,
			serverInEvents: events.getEventNames(config.eventChannels._SOCKETS_),
			// Events which are sent by the server using sockets
			serverOutEvents: []
		});

		socketsEvents.forEach(event => {
			socket.on(event.name, (clientData) => {
				socket.active = true;
				// Run validation and make sure needed data is present
				// Then create
				let data = {};
				let inputValid = true;
				data = Object.assign({}, clientData, {
					[parameterList.SOCKET_ID]: socket.id,
					serverID
				});

				event.data.every(param => {
					if(typeof data[param] === 'undefined') {	
						inputValid = false;
						console.log(`MA: connectUser error. Parameter missing: ${param}`);
						return inputValid; 
					}
					return true;
				});
				
				// Send event over redis
				pub.publish(event.name, JSON.stringify(data));
				console.log('Socket Management ---------------------')
				console.log(data);
				console.log("Recieved data for", event.name);
				console.log('--------------------- Socket Management')
				// Send data over redis. However i need a  serverID at this point. 
			});
		})

	})
}

module.exports = {
	handleSocketConnections
}