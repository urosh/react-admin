"use strict";

const config = require('../config');
const parametersList = config.parametersList;
const languages = config.languages;
const _ = require('lodash');
const uidGenerator = require('./utils/uidGenerator');
const moment = require('moment-timezone');
const FCM = require('fcm-push');
const adminFcm = new FCM(config.ADMIN_FCM_SERVER_KEY);
const clientFcm = new FCM(config.CLIENT_FCM_SERVER_KEY);
const usersFilters = require('./utils/usersFiltering')();
moment().tz("UTC").format();

const setEventDate = () => moment.utc().format('lll');

const clientMessageValidation = (data) => {
	if(!data.body) {
		return {
			error: 'Bad request format'
		}
	}
	var requestData = data.body;
	
	if(!requestData[parametersList.FILTERS]) {
		return {
			error: 'Filters are not defined'
		}
	};

	
	if(!requestData[parametersList.PUSH]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	if(!requestData[parametersList.SOCKETS]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	Object.keys(requestData.push.title).forEach(lang => {
		if(requestData[parametersList.PUSH].text[lang] !== ''){
			requestData[parametersList.PUSH].text[lang] = requestData[parametersList.PUSH].text[lang];
			requestData[parametersList.SOCKETS].text[lang] = requestData[parametersList.SOCKETS].text[lang];
			requestData[parametersList.PUSH].title[lang] = setEventDate() + ' GMT';
		}
	});
	
	requestData.triggerType = 'client message';
	requestData.triggerRecievedTime = new Date();
	requestData.messageTime =  setEventDate() + ' GMT';
	requestData.triggerID = uidGenerator();
	
	return requestData;
}

const formatAlertMessage = (message, language) => {
	return {
		message: message[parametersList.SOCKETS].text[language],
        url: message.action[language],
        title: message[parametersList.SOCKETS].title[language],
        triggerID: message.triggerID,
        messageTime: message.messageTime
	}
}

const formatPushMessage = (message, language, user, push) => {
	let result = {
		collapse_key: 'Client Message',
		data: {
			title: message[parametersList.PUSH].title[language],
			detail: message[parametersList.PUSH].text[language],
			pushUrl: message.action[language],
			triggerID: message.triggerID,
			messageType: 'Client Message',
			pushServerUrl: message.pushServerUrl,
		}
	}
	if(user) {
		result.data[parametersList.TOKEN] = push[parametersList.TOKEN];
		result.to = push[parametersList.TOKEN];
	}
	if(push) {
		result.data[parametersList.MACHINE_HASH] = push[parametersList.MACHINE_HASH];

	}
	return result;
}

module.exports  = (directMessaging, usersManagement, adminManagement) => {
	
	const usersFiltering = require('./utils/usersFiltering')(usersManagement);
	// Mobile App Api methods
	directMessaging.addEvent(
		'messagePreview',
		config.eventChannels.ROUTES,
		[
			parametersList.FILTERS,
			parametersList.PUSH,
			parametersList.SOCKETS
		],
		function(req, res) {
			
			let message = clientMessageValidation(req);
			if('error' in message) {
				res.send(message.error);
			}
			message.pushServerUrl = 'https://' + req.get('host');
			
			const adminUser = adminManagement.getUser(message.adminUsername);
			if(!adminUser) return;
			let io = directMessaging.getSocketsConnection();

			Object.keys(languages).forEach(code => {

				let language = languages[code];
				if(message[parametersList.SOCKETS].text[language]){
					var socketMessage = formatAlertMessage(message, language);
					io.sockets.in(message.adminUsername).emit('clientNotificationPreview', socketMessage);
				}

				if(adminUser[parametersList.TOKEN] && message[parametersList.PUSH].text[language]){
					var notificationMessage = formatPushMessage(message, language);
					notificationMessage.to = adminUser[parametersList.TOKEN];
					
					adminFcm.send(notificationMessage, function(err, response){
					    if (err) {
					    	console.log(`FCM-Sending message to browser: [${adminUser[parametersList.TOKEN]}]`.red + ` Error: ${err}`);
					    	return;
					    }
					});
				}

			})
		},
		'post',
		'/live/client-trigger/preview',
		false
	)
	
	directMessaging.addEvent(
		'messageSend',
		config.eventChannels.ROUTES,
		[
			parametersList.TOKEN,
			parametersList.USER_ID,
		],
		function(req, res) {
			let message = clientMessageValidation(req);
			if('error' in message) {
				res.send(message.error);
			}
			message.pushServerUrl = 'https://' + req.get('host');
			const recipients = usersFilters.getUsersList(usersManagement, message.filters);
			let io = directMessaging.getSocketsConnection();
			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					// Send alerts
					if(message[parametersList.SOCKETS].text[language]){
						recipients.userInfo.alerts.forEach(user => {
							let messageData = formatAlertMessage(message, language);
							let room = language + '-' + user[parametersList.USER_ID]
							io.sockets.in(room).emit('client-notification', messageData);						
						})
					}

					if(message[parametersList.PUSH].text[language]){
						recipients.userInfo.push.forEach(user => {
							user[parametersList.PUSH].forEach(push => {
								if(push[parametersList.LANGUAGE] === language && push[parametersList.PUSH_ACTIVE]){
									let notificationMessage = formatPushMessage(message, language, user, push);
									clientFcm.send(notificationMessage, function(err, response){
									    if (err) {
									    	console.log(`FCM-Sending message to browser:  Error: ${err}`);
									    	return;
									    }
									});
								}
							})
						})

					}
				})
			res.send('ok');
		},
		'post',
		'/live/client-trigger',
		false
	)

	


}