"use strict";
// Module for registering events. 

const event = {
	name: '',
	validator: [],
	type: '',
	handler: {}
}
module.exports = {
	events : {
		sockets: [],
		routers: []
	},
	addEvent(name, channel, validator, handler) {
		// I need a validation and that i am going to do using unit tests
		if(!name || !channel || !this.events[channel]) return -1;
		
		if(!Array.isArray(validator)) return -1;
		if(typeof handler !== 'function') return -1;
		
		if(this.events[channel].filter(ev => ev.name === name).length === 0) {
			this.events = Object.assign({}, this.events,
				{
				[channel]: 	this.events[channel].concat([{
								name,
								validator,
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
	reset() {
		this.events = {
			sockets: [],
			routers: []
		}
	}

}