"use strict";

const events = require('./events');
const config = require('../../config');


const handleSocketConnections = (io) => {
	let socketsEvents = events.getEvents(config.eventChannels._SOCKETS_);
	io.on('connection', (socket) => {
		socketsEvents.forEach(ev => {
			socket.on(ev.name, ev.handler);
		})

	})
}

module.exports = {
	handleSocketConnections
}