/*
 * Http requests management module
 * 
 * Handles http request to the system 
 * 
 * Based on the trigger type it sends data over redis to other 
 * instances or it runs the handlers and returns some data back over 
 * the network. 
 * 
 */
"use strict";

/*
 * Input data validation function, same as in socket management and redis 
 * management
 * 
 */
const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
			if(current === ''){
			    if (next in data) return '';
			    return next;
			}
			return current;
		}, '') ;
}

module.exports = function(){
	let pub;
	/*
	 * Module init function 
	 * 
	 * Triggers the routes module. 
	 * 
	 * @params options object Passing redis instance
	 * @params app Passing node app instance 
	 * @params events object Events module
	 * @return void; 
	 */
	const init = (options, app, events) => {
		if(!options && !options.redis){
			return
		}
		//List of all http events
		const routeEvents = events.getEvents('http');
		// Get events
		const getEvents = routeEvents.filter(event => event.method === 'get');
		// Post distributed events
		const postDistributedEvents = routeEvents.filter(event => event.method === 'post' && event.distributed);
		// Post non distributed events
		const postNonDistributedEvents = routeEvents.filter(event => event.method === 'post' && !event.distributed);
		const serverID = options.serverID;
		
		pub = options.redis.pub;
		

		/*
		 * Post non distributed and get events should execute their handlers 
		 * straight after receiving the triggers
		 *
		 */
		getEvents.forEach(event => {
			app.get(event.name, event.handler);
		})

		postNonDistributedEvents.forEach(event => {
			app.post(event.url, event.handler)
		})
		
		// Post distributed events should be passed to other server instances
		postDistributedEvents.forEach(event => {
			app.post(event.url, (req, res, next) => {
				let data = {};
				let inputValid = true;
				// Adding serverId, and socket.id to the data
				const requestData = req.body.data || req.body;
				
				data = Object.assign({}, requestData, {
					serverID,
					host: 'https://' + req.get('host')
				});
				
				const validation = checkRecievedData(event.data, data);
				
				// Check validation result and send proper response 
				if(validation !== ''){
					console.log(`Post request error: Parameter ${validation} missing from the request`)
					res.json({
						"status": "error",
						"message": `Parameter ${validation} missing from the request`
					});
				}else{
					// Boradcast event using redis
					pub.publish(event.name, JSON.stringify(data));
				
					res.json({
						"status": "succcess",
						"message": "Post data recieved"
					});
				}
			});
		})
	}
	return {
		init
	}
}