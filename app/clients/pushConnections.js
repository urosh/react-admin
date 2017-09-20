"use strict";

const parameters = require('../parameters');
const _ = require('lodash');


module.exports  = (clients, usersManagement) => {
	
	const pushConnectionsHandlers = require('./pushConnectionsHandlers')(clients, usersManagement);

	// Push notification subscription
	clients.addSocketInEvent({
		name: 'pushSubscribe',
		data: [
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.messageChannels.TAB_ACTIVE,
		],
		handler: pushConnectionsHandlers.pushSubscribe,
		distributed: true,
		tracking: pushConnectionsHandlers.pushSubscribeTracker
	})

	// Push notification subscription
	clients.addHttpInEvent({
		name: 'transformPushData',
		data: [],
		handler: pushConnectionsHandlers.transformPushData,
		method: 'post',
		url: '/devices/push/transform',
		distributed: true
	})
	

	// Push notification removing subscription
	clients.addSocketInEvent({
		name: 'pushUnsubscribe',
		data: [
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH
		],
		handler: pushConnectionsHandlers.pushUnsubscribe,
		distributed: true,
		tracking: pushConnectionsHandlers.pushUnsubscribeTracker
	})

}