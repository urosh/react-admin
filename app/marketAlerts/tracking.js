"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports  = (marketAlerts, usersManagement) => {
	
	// Api methods for retrieving stats about users
	marketAlerts.addEvent(
		'pushDelivered',
		config.eventChannels.ROUTES,
		[
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.USER_LOGGED_IN,
			parametersList.TRIGGER_ID,
			parametersList.TRIGGER_TYPE,
			parametersList.NOTIFICATION_RECEIVED,
			parametersList.SERVER_ID
		],
		function(data) {
			let pub = marketAlerts.getRedisConnection();

			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				pub.publish('tracking.pushDelivered', JSON.stringify({
					userID:  data[parametersList.USER_ID],
					machineHash: data[parametersList.MACHINE_HASH],
					userLoggedIn: data[parametersList.USER_LOGGED_IN],
					triggerID: data[parametersList.TRIGGER_ID],
					triggerType: data[parametersList.TRIGGER_TYPE],
					notificationRecieved: data[parametersList.NOTIFICATION_RECEIVED],
					pushID: data[parametersList.PUSH_ID]
				}));
			}
		},
		'post',
		'/api/track/push/delivered'
	)
	
	

}