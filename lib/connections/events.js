"use strict";
// Module for registering events. 

const utils = require('./utils');

module.exports = function(){
	return{
		events: {},
	
		addEvent(name, direction, channel, data, handler, distributed, method, url  ) {
			if(!name || !channel || !direction) return -1;
			
			if(!Array.isArray(data)) return -1;
			
			if(typeof handler !== 'function') return -1;
			
			if(this.events[name]) return -1;

			//console.log(name + '-' + channel + '-' + distributed);
			this.events = Object.assign({}, this.events, {
				[name]: {
					name,
					direction,
					channel,
					data,
					handler,
					distributed,
					method,
					url
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
		
		getEvents(channel, direction) {
			if(!channel) return [];

			return Object.keys(this.events)
					.map(name => this.events[name])
					.filter(ev => ev.channel === channel)
		},

		getEventNames(channel, direction) {
			let eventNames = {};
			Object.keys(this.events)
				.forEach(event => {
					eventNames[utils.camelToUnderscore(event)] = event;
				});
			return eventNames;
		},
		
		reset() {
			this.events = {}
		},

		getAllEvents() {
			return events;
		}
	}
}