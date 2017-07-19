"use strict";

const config = require('../config');
const parameters = require('../parameters');
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
	
	if(!requestData[parameters.admin.FILTERS]) {
		return {
			error: 'Filters are not defined'
		}
	};

	
	if(!requestData[parameters.messageChannels.PUSH]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	if(!requestData[parameters.messageChannels.SOCKETS]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	Object.keys(requestData.push.title).forEach(lang => {
		if(requestData[parameters.messageChannels.PUSH].text[lang] !== ''){
			requestData[parameters.messageChannels.PUSH].text[lang] = requestData[parameters.messageChannels.PUSH].text[lang];
			requestData[parameters.messageChannels.SOCKETS].text[lang] = requestData[parameters.messageChannels.SOCKETS].text[lang];
			requestData[parameters.messageChannels.PUSH].title[lang] = setEventDate() + ' GMT';
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
		message: message[parameters.messageChannels.SOCKETS].text[language],
        url: message.action[language],
        title: message[parameters.messageChannels.SOCKETS].title[language],
        triggerID: message.triggerID,
        messageTime: message.messageTime
	}
}

const formatPushMessage = (message, language, user, push) => {
	let result = {
		collapse_key: 'Client Message',
		data: {
			title: message[parameters.messageChannels.PUSH].title[language],
			detail: message[parameters.messageChannels.PUSH].text[language],
			pushUrl: message.action[language],
			triggerID: message.triggerID,
			messageType: 'Client Message',
			pushServerUrl: message.pushServerUrl,
		}
	}
	if(user) {
		result.data[parameters.messageChannels.TOKEN] = push[parameters.messageChannels.TOKEN];
		result.to = push[parameters.messageChannels.TOKEN];
	}
	if(push) {
		result.data[parameters.messageChannels.MACHINE_HASH] = push[parameters.messageChannels.MACHINE_HASH];

	}
	return result;
}

module.exports  = (directMessaging, usersManagement, adminManagement) => {
	
	const usersFiltering = require('./utils/usersFiltering')(usersManagement);
	// Mobile App Api methods
	directMessaging.addHttpInEvent(
		'messagePreview',
		[
			parameters.admin.FILTERS,
			parameters.messageChannels.PUSH,
			parameters.messageChannels.SOCKETS
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
				if(message[parameters.messageChannels.SOCKETS].text[language]){
					var socketMessage = formatAlertMessage(message, language);
					io.sockets.in(message.adminUsername).emit('clientNotificationPreview', socketMessage);
				}

				if(adminUser[parameters.messageChannels.TOKEN] && message[parameters.messageChannels.PUSH].text[language]){
					var notificationMessage = formatPushMessage(message, language);
					notificationMessage.to = adminUser[parameters.messageChannels.TOKEN];
					
					adminFcm.send(notificationMessage, function(err, response){
					    if (err) {
					    	console.log(`FCM-Sending message to browser: [${adminUser[parameters.messageChannels.TOKEN]}]`.red + ` Error: ${err}`);
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
	
	directMessaging.addHttpInEvent(
		'messageSend',
		[
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
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
					if(message[parameters.messageChannels.SOCKETS].text[language]){
						recipients.userInfo.alerts.forEach(user => {
							let messageData = formatAlertMessage(message, language);
							let room = language + '-' + user[parameters.user.USER_ID]
							io.sockets.in(room).emit('client-notification', messageData);						
						})
					}

					if(message[parameters.messageChannels.PUSH].text[language]){
						recipients.userInfo.push.forEach(user => {
							user[parameters.messageChannels.PUSH].forEach(push => {
								if(push[parameters.user.LANGUAGE] === language && push[parameters.messageChannels.PUSH_ACTIVE]){
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