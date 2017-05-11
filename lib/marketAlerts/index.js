// check connections module
// recieve data from redis
// redis module

// than manage users. 
const socketManagement = require('./socketManagement');
const socketIO = require('socket.io');
const config = require('../../config');
const events = require('./events');


module.exports  = (http) => {
	const init = (options) => {
		
		events.registerEvents();
		
		const io = socketIO(http, {
			origins: config.socketOrigins,
			path: '/live/socket.io'
		});
		
		socketManagement.handleSocketConnections(io, events);
				
	}

	return {
		init
	}
	
}