"use strict";

const config = require('../../config');
const parametersList = require('./parameterList').parametersList;
const Redis = require('ioredis');

const pub = new Redis({
	sentinels: config.sentinels,
	name: 'redis-cluster'
});

const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
			if(current === ''){
			    if (next in data) return '';
			    return next;
			}
			return current;
		}, '') ;
}

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
				pub.publish(event.name, JSON.stringify(data));
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