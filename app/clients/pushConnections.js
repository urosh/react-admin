"use strict";

const parameters = require('../parameters');
const _ = require('lodash');


module.exports  = (clients, usersManagement) => {
	
	const pushConnectionsHandlers = require('./pushConnectionsHandlers')(clients, usersManagement);

	// Push notification subscription
	clients.addSocketInEvent(
		'pushSubscribe',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.messageChannels.TAB_ACTIVE,
		],
		pushConnectionsHandlers.pushSubscribe
	)

	// Push notification subscription
	clients.addHttpInEvent(
		'transformPushData',
		[],
		pushConnectionsHandlers.transformPushData,
		'post',
		'/devices/push/transform'
	)
	

	// Push notification removing subscription
	clients.addSocketInEvent(
		'pushUnsubscribe',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH
		],
		pushConnectionsHandlers.pushUnsubscribe
	)


}