"use strict";

const Redis = require('ioredis');

const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
			if(current === ''){
			    if (next in data) return '';
			    return next;
			}
			return current;
		}, '') ;
}


const addRoutes = (options, app, events) => {
	const routeEvents = events.getEvents('routes');
	const getEvents = routeEvents.filter(event => event.method === 'get');
	const postEvents = routeEvents.filter(event => event.method === 'post');
	const serverID = options.serverID;
	let pub;

	if(options.redis){
		pub = new Redis(options.redis);
	}

	getEvents.forEach(event => {
		app.get(event.name, event.handler);
	})

	postEvents.forEach(event => {
		app.post(event.url, (req, res, next) => {
			let data = {};
			let inputValid = true;
			// Adding serverId, and socket.id to the data
			const requestData = req.body.data || req.body;
			
			data = Object.assign({}, requestData, {
				serverID,
				host: req.get('host')
			});
			
			const validation = checkRecievedData(event.data, data);
			
			if(validation !== ''){
				res.json({
					"status": "error",
					"message": `Parameter ${validation} missing from the request`
				});
			}else{
				if(pub){
					pub.publish(event.name, JSON.stringify(data));
				}

				res.json({
					"status": "succcess",
					"message": "Post data recieved"
				});
			}

		});
	})
}

module.exports = {
	addRoutes
}