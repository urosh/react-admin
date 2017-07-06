"use strict";
// Module for registering events. 

const utils = require('./utils');

module.exports = function(){
	return{
		events: {},
	
		addEvent(name, channel, data, handler, method, url, distributed) {
			// I need a validation and that i am going to do using unit tests
			if(!name || !channel) return -1;
			
			if(!Array.isArray(data)) return -1;
			
			if(typeof handler !== 'function') return -1;
			
			if(this.events[name]) return -1;
			//console.log(name + '-' + method);
			this.events = Object.assign({}, this.events, {
				[name]: {
					name,
					channel,
					data,
					handler,
					method,
					url,
					distributed
				}
			});
			return name;
		},
		
		removeEvent(ev) {
			if(!ev || !this.events[ev]) return;
			let res = Object.assign({}, this.events);
			delete res[ev];
			this.events = res;
		},
		
		getEvents(channel) {
			if(!channel) return [];
			return Object.keys(this.events)
					.map(name => this.events[name])
					.filter(ev => ev.channel === channel)
		},

		getEventNames() {
			let eventNames = {};
			Object.keys(this.events)
				.forEach(event => {
					eventNames[utils.camelToUnderscore(event)] = event;
				});
			return eventNames;
		},
		
		reset() {
			this.events = {}
		}
	}
}