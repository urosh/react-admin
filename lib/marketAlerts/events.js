"use strict";
// Module for registering events. 
const parameterList = require('./parameterList').parameterList;
const messageChannels = require('./parameterList').messageChannels;

const config = require('../../config');
const utils = require('../../utils');
const event = {
	name: '',
	data: [],
	channel: '',
	handler: {}
}

module.exports = {
	
	events: {},
	
	addEvent(name, channel, data, handler) {
		// I need a validation and that i am going to do using unit tests
		if(!name || !channel) return -1;
		
		if(!Array.isArray(data)) return -1;
		
		if(typeof handler !== 'function') return -1;
		
		if(this.events[name]) return -1;

		this.events = Object.assign({}, this.events, {
			[name]: {
				name,
				channel,
				data,
				handler
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
	
	getEvents() {
		return Object.keys(this.events)
			.map(name => this.events[name]);
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