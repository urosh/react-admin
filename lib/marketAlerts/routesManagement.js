"use strict";

const config = require('../../config');
const parametersList = require('./parameterList').parametersList;
const Redis = require('ioredis');

const pub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

const addRoutes = (app, events, serverID) => {
	const routeEvents = events.getEvents(config.eventChannels.ROUTES);
	const getEvents = routeEvents.filter(event => event.method === config.eventChannels.GET);
	const postEvents = routeEvents.filter(event => event.method === config.eventChannels.POST);
	
	getEvents.forEach(event => {
		app.get(event.name, event.handler);
	})

	postEvents.forEach(event => {
		app.post(event.url, (req, res, next) => {
			let data = {};
			let inputValid = true;
			
			// Adding serverId, and socket.id to the data
			data = Object.assign({}, req.body, {
				serverID
			});
			
			event.data.every(param => {
				if(typeof data[param] === 'undefined') {	
					inputValid = false;
					console.log(`MA: POST Request error. Parameter missing: ${param}`);
					res.json({
						"status": "succcess",
						"message": `Parameter ${param} missing from the request`
					});
					return inputValid; 
				}
				return true;
			});
			
			res.json({
				"status": "succcess",
				"message": "Post data recieved"
			});
		});
	})
}

module.exports = {
	addRoutes
}