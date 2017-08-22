"use strict";

const config = require('../config');
const parameters = require('../parameters');
const languages = config.languages;
const _ = require('lodash');
const uidGenerator = require('../uidGenerator');
const moment = require('moment-timezone');
const FCM = require('fcm-push');
const adminFcm = new FCM(config.ADMIN_FCM_SERVER_KEY);
const clientFcm = new FCM(config.CLIENT_FCM_SERVER_KEY);
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

module.exports  = (marketAlerts, usersManagement) => {
	
	
	marketAlerts.addHttpInEvent(
		'messageSend',
		[
			parameters.admin.FILTERS
		],
		function(req, res, data) {
			let message = clientMessageValidation(req);
			if('error' in message) {
				res.send(message.error);
			}
			message.pushServerUrl = 'https://' + req.get('host');
			const recipients = usersManagement.usersFiltering.getUsersList(message.filters);
			let io = marketAlerts.getSocketsConnection();
			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					// Send alerts
					if(message[parameters.messageChannels.SOCKETS].text[language]){
						recipients.userInfo.alerts.forEach(user => {
							let messageData = formatAlertMessage(message, language);
							let parameter = usersManagement.getIdParameter(user);
							let room = language + '-' + user[parameter];
							console.log(parameter);
							console.log(room);
							console.log(messageData);
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
		'/live/client-trigger'
	)

	


}