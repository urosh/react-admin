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
		const io = socketIO(http, {
			origins: config.socketOrigins,
			path: '/live/socket.io'
		});
		
		events.addEvent('register', config.eventChannels._SOCKETS_, [], (data) => {
			console.log('We should now handle the registration event. ');
		})


		socketManagement.handleSocketConnections(io);
				
	}

	return {
		init
	}
	
}