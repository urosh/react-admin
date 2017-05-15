"use strict";

const config = require('../../config');
const parameterList = require('./parameterList');



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
				
				console.log(data);
				console.log("Recieved data for", event.name);
				
				// Send data over redis. However i need a  serverID at this point. 
			});
		})

	})
}

module.exports = {
	handleSocketConnections
}