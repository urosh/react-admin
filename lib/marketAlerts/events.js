// Module for registering events. 
const event = {
	name: '',
	validator: [],
	type: '',
	handler: {}
}
module.exports = {
	events: ['user.register', 'visitor.register'],
	addEvent(name, validator, handler) {

	},
	removeEvent() {

	},
	getEvents() {
		return this.events;
	}
}