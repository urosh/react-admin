// socket on connect
// Do i perform any checking?
// I could, and i could use module for input checking. 
// There has to be naming convention, that event passes by socket, is the same 
// event i am going to pass to redis. 

var events = require('events');

events
	.filter(event => {
		event.inputType === 'socket'
	})
	.forEach(event => {
		socket.on(event.name, event.handler);
	});

	