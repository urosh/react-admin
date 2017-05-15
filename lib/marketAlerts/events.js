"use strict";
// Module for registering events. 
const parameterList = require('./parameterList');
const config = require('../../config');
const utils = require('../../utils');
const event = {
	name: '',
	data: [],
	type: '',
	handler: {}
}

module.exports = {
	events : {
		sockets: [],
		routers: []
	},
	addEvent(name, channel, data, handler) {
		// I need a validation and that i am going to do using unit tests
		if(!name || !channel || !this.events[channel]) return -1;
		
		if(!Array.isArray(data)) return -1;
		if(typeof handler !== 'function') return -1;
		
		if(this.events[channel].filter(ev => ev.name === name).length === 0) {
			this.events = Object.assign({}, this.events,
				{
				[channel]: 	this.events[channel].concat([{
								name,
								data,
								handler
							}])
				}
			)
		}	
		
		return name;
	},
	removeEvent(ev, channel) {
		if(!ev || !channel || !this.events[channel]) return;
		this.events = 
			Object.assign(
				{}, 
				this.events, 
				{
					[channel]: this.events[channel].filter(e => e.name !== ev )
				}
			)
	},
	getEvents(channel) {
		return this.events[channel] || [];
	},
	getEventNames(channel) {
		let eventNames = {};
		this.events[channel]
			.forEach(event => {
				eventNames[utils.camelToUnderscore(event.name)] = event.name
			})
		return eventNames;
	},
	reset() {
		this.events = {
			sockets: [],
			routers: []
		}
	}
	

}