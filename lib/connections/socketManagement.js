"use strict";

const Redis = require('ioredis');
const socketIO = require('socket.io');

const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
		if(current === ''){
		    if (next in data) return '';
		    return next;
		}
		return current;
	}, '') ;
}

let io, pub; 

const handleSocketConnections = (options, http, events, parametersList) => {
	
	if(options.redis){
		pub = new Redis(options.redis);
	}
	// Get registered socket's events 
	let socketsEvents = events.getEvents('sockets');
	
	const serverID = options.serverID;
	
	io = socketIO(http, {
		origins: options.socket.origins,
		path: options.socket.path
	});

	io.on('connection', (socket) => {
		
		// Send parametersList, and registered socket events to client	
		socket.emit('connected', {
			parametersList: parametersList,
			serverInEvents: events.getEventNames('sockets'),
			serverOutEvents: []
		});
		
		socketsEvents.forEach(event => {
			socket.on(event.name, (clientData) => {
				//socket.active = true;
				let data = {};
				let inputValid = true;
				
				// Adding serverId, and socket.id to the data
				data = Object.assign({}, clientData, {
					'socketID' : socket.id,
					serverID
				});
				
				const validation = checkRecievedData(event.data, data);
			
				if(validation !== ''){
					console.log(`MA: ${event.name} error. Parameter missing: ${validation}`);
				}else{
					if(pub){
						pub.publish(event.name, JSON.stringify(data));
						
					}
				}
	
			});
		})
	})
}

const getIo = () =>  io;

module.exports = {
	handleSocketConnections,
	getIo
}