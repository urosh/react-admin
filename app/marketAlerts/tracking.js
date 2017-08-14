"use strict";
const parameters = require('../parameters');

module.exports  = (marketAlerts, usersManagement) => {
	
	// Api methods for retrieving stats about users
	marketAlerts.addHttpInEvent(
		'pushDelivered',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.user.USER_LOGGED_IN,
			parameters.tracking.TRIGGER_ID,
			parameters.tracking.TRIGGER_TYPE,
			parameters.tracking.NOTIFICATION_RECEIVED,
			parameters.general.SERVER_ID,
			parameters.tracking.PUSH_ID
		],
		function(req, res) {
			let pub = marketAlerts.getRedisConnection();
			let data = req.body;
			pub.publish('tracking.pushDelivered', JSON.stringify({
				userID:  data[parameters.user.USER_ID],
				machineHash: data[parameters.messageChannels.MACHINE_HASH],
				userLoggedIn: data[parameters.user.USER_LOGGED_IN],
				triggerID: data[parameters.tracking.TRIGGER_ID],
				triggerType: data[parameters.tracking.TRIGGER_TYPE],
				notificationRecieved: data[parameters.tracking.NOTIFICATION_RECEIVED],
				pushID: data[parameters.tracking.PUSH_ID]
			}));
			res.send('ok');

		},
		'post',
		'/api/track/push/delivered'
	)
	
	marketAlerts.addHttpInEvent(
		'pushClicked',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.user.USER_LOGGED_IN,
			parameters.tracking.TRIGGER_ID,
			parameters.tracking.TRIGGER_TYPE,
			parameters.tracking.NOTIFICATION_RECEIVED,
			parameters.general.SERVER_ID,
			parameters.tracking.PUSH_ID
		],
		function(req, res) {
			let pub = marketAlerts.getRedisConnection();
			let data = req.body;
			
			pub.publish('tracking.pushClicked', JSON.stringify({
				userID:  data[parameters.user.USER_ID],
				machineHash: data[parameters.messageChannels.MACHINE_HASH],
				userLoggedIn: data[parameters.user.USER_LOGGED_IN],
				triggerID: data[parameters.tracking.TRIGGER_ID],
				triggerType: data[parameters.tracking.TRIGGER_TYPE],
				notificationRecieved: data[parameters.tracking.NOTIFICATION_RECEIVED],
				pushID: data[parameters.tracking.PUSH_ID],
				action: 'clicked',
				actionTime: new Date()
			}));

			res.send('ok')
		},
		'post',
		'/api/track/push/clicked',
		false
	)
	
	marketAlerts.addHttpInEvent(
		'pushClicked',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.user.USER_LOGGED_IN,
			parameters.tracking.TRIGGER_ID,
			parameters.tracking.TRIGGER_TYPE,
			parameters.tracking.NOTIFICATION_RECEIVED,
			parameters.general.SERVER_ID,
			parameters.tracking.PUSH_ID
		],
		function(req, res) {
			let pub = marketAlerts.getRedisConnection();
			let data = req.body;
			
			pub.publish('tracking.pushClosed', JSON.stringify({
				userID:  data[parameters.user.USER_ID],
				machineHash: data[parameters.messageChannels.MACHINE_HASH],
				userLoggedIn: data[parameters.user.USER_LOGGED_IN],
				triggerID: data[parameters.tracking.TRIGGER_ID],
				triggerType: data[parameters.tracking.TRIGGER_TYPE],
				notificationRecieved: data[parameters.tracking.NOTIFICATION_RECEIVED],
				pushID: data[parameters.tracking.PUSH_ID],
				action: 'closed',
				actionTime: new Date()
			}));

			res.send('ok');
			
		},
		'post',
		'/api/track/push/closed',
		false
	)

	marketAlerts.addSocketInEvent(
		'notificationDelivered', 
		[
			parameters.messageChannels.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();
			
			data.notificationInfoRecieved = new Date();
			pub.publish('tracking.notificationDelivered', JSON.stringify(data));
			
		},
		false
	);
	
	marketAlerts.addSocketInEvent(
		'notificationAction', 
		[
			parameters.messageChannels.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();
			pub.publish('tracking.notificationAction', JSON.stringify(data));
			
		},
		false

	);

	marketAlerts.addSocketInEvent(
		'notificationVisible', 
		[
			parameters.messageChannels.SOCKET_ID
		], 
		function(data){
			let pub = marketAlerts.getRedisConnection();
			pub.publish('tracking.notificationVisible', JSON.stringify(data));
		},
		false
	);

}