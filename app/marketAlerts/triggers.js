"use strict";
const config = require('../config');
const parametersList =config.parametersList;
const marketAlertTranslate = require('./utils/marketAlerts');
const languages = config.languages;
var FCM = require('fcm-push');
var serverKey = 'AIzaSyBuBkx25PYli0uCjdzhp20p9M6CqMibKyc';
var fcm = new FCM(serverKey);

const uidGenerator = require('./utils/uidGenerator');


module.exports = (marketAlerts, usersManagement) => {
	
	
	
	marketAlerts.addEvent(
		'marketAlertTrigger',
		config.eventChannels.ROUTES,
		[
			parametersList.ROW_ID,
			parametersList.EVENT_ID,
			parametersList.EVENT_DATE,
			parametersList.BASE_CURR,
			parametersList.NON_BASE_CURR,
			parametersList.EVENT_TYPE_ID,
			parametersList.NEW_VALUE,
			parametersList.OLD_VALUE,
			parametersList.LAST_EVENT_DATE,
			parametersList.DIFFERENCE,
			parametersList.EVENT_DESCRIPTION
		],
		function(data) {
			let processedData = marketAlertTranslate(data);
			
			let io = marketAlerts.getSocketsConnection();
			
			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					const room = language + '-' + parametersList.INSTRUMENT + '-' + processedData.socket[language][parametersList.INSTRUMENT];
					io.sockets.in(room).emit('market-notification', processedData.socket[language]);
				});
			
			usersManagement.getPushUsers(processedData[parametersList.INSTRUMENT]).forEach(push => {
				console.log('We got here');
				const language = push[parametersList.LANGUAGE];
				console.log(processedData.push[language]);
				/*const pushMessage = {
					to: push[parametersList.TOKEN],
					collapse_key: 'Market Alert',
					data: {
						title: processedData.title[language],
						detail: processedData.push[language],
						messageType: 'Market Alert',
						socketMessage: processedData.socket[language],
						pushUrl: processedData.action.push,
						triggerID: triggerID,
						machineHash: push[parametersList.MACHINE_HASH],
						userID: push[parametersList.USER_ID],
						userLoggedIn: push[parametersList.USER_ID],
						pushServerUrl: processedData[parametersList.PUSH_SERVER_URL],
						instrument: processedData[parametersList.INSTRUMENT],
						token: push[parametersList.TOKEN],
						messageType: processedData[parametersList.TYPE]
					}
				};
*/
				//console.log(pushMessage);
				
			})


		},
		'post',
		'/live/market-trigger'
	)

	marketAlerts.addEvent(
		'marketAlertTriggerTest',
		config.eventChannels.ROUTES,
		[
			parametersList.ROW_ID,
			parametersList.EVENT_ID,
			parametersList.EVENT_DATE,
			parametersList.BASE_CURR,
			parametersList.NON_BASE_CURR,
			parametersList.EVENT_TYPE_ID,
			parametersList.NEW_VALUE,
			parametersList.OLD_VALUE,
			parametersList.LAST_EVENT_DATE,
			parametersList.DIFFERENCE,
			parametersList.EVENT_DESCRIPTION
		],
		function(data) {
			data[parametersList.TEST_ENABLED] = true;
			let processedData = marketAlertTranslate(data);
			let io = marketAlerts.getSocketsConnection();
		},
		'post',
		'/live/market-trigger/test'
	)	


}

