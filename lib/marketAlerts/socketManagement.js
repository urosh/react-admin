"use strict";

const config = require('../../config');
const parameterList = require('./parameterList');



const handleSocketConnections = (io, events) => {
	let socketsEvents = events.getEvents(config.eventChannels._SOCKETS_);
	io.on('connection', (socket) => {
		socket.emit('connected', {
			parameterList: parameterList,
			serverInEvents: events.getEvents(config.eventChannels._SOCKETS_),
			serverOutEvents: []
		});

		socketsEvents.forEach(event => {
			socket.on(event.name, (clientData) => {
				socket.active = true;
				// Run validation and make sure needed data is present
				// Then create
				let data = {};
				let inputValid = true;
				event.data.every(param => {
					if(!clientData[param]) {	
						inputValid = false;
						return inputValid; 
					}
					data[param] = clientData[param];
					return true;
				});
				if(inputValid) {
					data.parameterList.SOCKET_ID = socket.id;
					// Send data over redis
				}

				console.log("Our data from the browser");
				console.log(data);
				
				// publish 
			});
		})

	})
}

module.exports = {
	handleSocketConnections
}