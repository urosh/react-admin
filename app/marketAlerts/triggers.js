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
					const room = language + '-' + parametersList.INSTRUMENT + '-' + processedData[parametersList.INSTRUMENT];
					io.sockets.in(room).emit('market-notification', {
		            	message: processedData.socket[language],
		            	url: processedData.action.socket[language],
		            	title: processedData.title[language],
		            	type: processedData.type,
		            	triggerID: processedData.triggerID,
		            	instrument: processedData.instrument
		            });
				});
			
			usersManagement.getPushUsers(processedData[parametersList.INSTRUMENT]).forEach(push => {
				console.log(push);
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

