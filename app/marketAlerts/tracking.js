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
			parametersList.SERVER_ID,
			parametersList.PUSH_ID
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
		'/api/track/push/delivered',
		false
	)
	
	marketAlerts.addEvent(
		'pushClicked',
		config.eventChannels.ROUTES,
		[
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.USER_LOGGED_IN,
			parametersList.TRIGGER_ID,
			parametersList.TRIGGER_TYPE,
			parametersList.NOTIFICATION_RECEIVED,
			parametersList.SERVER_ID,
			parametersList.PUSH_ID
		],
		function(data) {
			let pub = marketAlerts.getRedisConnection();

			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				pub.publish('tracking.pushClicked', JSON.stringify({
					userID:  data[parametersList.USER_ID],
					machineHash: data[parametersList.MACHINE_HASH],
					userLoggedIn: data[parametersList.USER_LOGGED_IN],
					triggerID: data[parametersList.TRIGGER_ID],
					triggerType: data[parametersList.TRIGGER_TYPE],
					notificationRecieved: data[parametersList.NOTIFICATION_RECEIVED],
					pushID: data[parametersList.PUSH_ID],
					action: 'clicked',
					actionTime: new Date()
				}));
			}
		},
		'post',
		'/api/track/push/clicked',
		false
	)
	
	marketAlerts.addEvent(
		'pushClicked',
		config.eventChannels.ROUTES,
		[
			parametersList.USER_ID,
			parametersList.MACHINE_HASH,
			parametersList.USER_LOGGED_IN,
			parametersList.TRIGGER_ID,
			parametersList.TRIGGER_TYPE,
			parametersList.NOTIFICATION_RECEIVED,
			parametersList.SERVER_ID,
			parametersList.PUSH_ID
		],
		function(data) {
			let pub = marketAlerts.getRedisConnection();

			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				pub.publish('tracking.pushClosed', JSON.stringify({
					userID:  data[parametersList.USER_ID],
					machineHash: data[parametersList.MACHINE_HASH],
					userLoggedIn: data[parametersList.USER_LOGGED_IN],
					triggerID: data[parametersList.TRIGGER_ID],
					triggerType: data[parametersList.TRIGGER_TYPE],
					notificationRecieved: data[parametersList.NOTIFICATION_RECEIVED],
					pushID: data[parametersList.PUSH_ID],
					action: 'closed',
					actionTime: new Date()
				}));
			}
		},
		'post',
		'/api/track/push/closed',
		false
	)

	marketAlerts.addEvent(
		'notificationDelivered', 
		config.eventChannels.SOCKETS, 
		[
			parametersList.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();

			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				data.notificationInfoRecieved = new Date();
				pub.publish('tracking.notificationDelivered', JSON.stringify(data));
			}
		}
	);
	
	marketAlerts.addEvent(
		'notificationAction', 
		config.eventChannels.SOCKETS, 
		[
			parametersList.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();

			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				pub.publish('tracking.notificationAction', JSON.stringify(data));
			}
		}
	);

	marketAlerts.addEvent(
		'notificationVisible', 
		config.eventChannels.SOCKETS, 
		[
			parametersList.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();
			
			if(data[parametersList.PROCESSING_SERVER_ID] === data[parametersList.SERVER_ID]){
				pub.publish('tracking.notificationVisible', JSON.stringify(data));
			}
		}
	);





}