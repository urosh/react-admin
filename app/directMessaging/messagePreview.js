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


module.exports = (directMessaging, usersManagement, adminManagement) => {
	
directMessaging.addHttpInEvent(
		'messagePreview',
		[
			parameters.admin.FILTERS,
			parameters.messageChannels.PUSH,
			parameters.messageChannels.SOCKETS
		],
		function(req, res, data) {
			res.send('Preview request received successfully');
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
					console.log('we should send this message to the admin');
					console.log(message.adminUsername);
					
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




}