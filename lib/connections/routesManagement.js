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
		
		const postEvents = routeEvents.filter(event => event.method === 'post');
		
		pub = options.redis.pub;
		
		const eventHandlerTrigger = (event, req, res) => {
			
			let data = {};
			let inputValid = true;
			
			const requestData = req.body.data || req.body;
			
			data = Object.assign({}, requestData, {
				host: 'https://' + req.get('host')
			});
			
			const validation = checkRecievedData(event.data, data);

			// Check validation result and send proper response 
			if(validation !== ''){
				console.log(`Request error: Parameter ${validation} missing from the request`)
				return res.json({
					"status": "error",
					"message": `Parameter ${validation} missing from the request`
				});
			}
			
			let handlerArguments = [req, res, data];
			
			event.handler.apply(null, handlerArguments);
		}

		// Handle get events
		getEvents.forEach(event => {
			app.get(event.name, eventHandlerTrigger.bind(null, event));
		})
	
		// Handle post events
		postEvents.forEach(event => {
			app.post(event.url, eventHandlerTrigger.bind(null, event));
		})
		
	}
	return {
		init
	}
}