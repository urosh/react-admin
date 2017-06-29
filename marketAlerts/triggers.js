"use strict";
const marketAlertsConfig = require('./config');
const generalConfig = require('../config');
const marketAlertsParameters = marketAlertsConfig.parametersList;
const uidGenerator = require('../utils/uidGenerator');
const marketAlertTranslate = require('./utils/marketAlerts');
const languages = marketAlertsConfig.languages;
var FCM = require('fcm-push');
var serverKey = 'AIzaSyBuBkx25PYli0uCjdzhp20p9M6CqMibKyc';
var fcm = new FCM(serverKey);


module.exports = (marketAlerts, io) => {
	const parametersList = marketAlerts.getParametersList();
	const usersManagement = marketAlerts.usersManagement;
	
	marketAlerts.addEvent(
		'marketAlertTrigger',
		generalConfig.eventChannels.ROUTES,
		[
			marketAlertsParameters.ROW_ID,
			marketAlertsParameters.EVENT_ID,
			marketAlertsParameters.EVENT_DATE,
			marketAlertsParameters.BASE_CURR,
			marketAlertsParameters.NON_BASE_CURR,
			marketAlertsParameters.EVENT_TYPE_ID,
			marketAlertsParameters.NEW_VALUE,
			marketAlertsParameters.OLD_VALUE,
			marketAlertsParameters.LAST_EVENT_DATE,
			marketAlertsParameters.DIFFERENCE,
			marketAlertsParameters.EVENT_DESCRIPTION
		],
		function(data) {
			let processedData = marketAlertTranslate(data);
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
				
			})


		},
		'post',
		'/live/market-trigger'
	)

	marketAlerts.addEvent(
		'marketAlertTriggerTest',
		generalConfig.eventChannels.ROUTES,
		[
			marketAlertsParameters.ROW_ID,
			marketAlertsParameters.EVENT_ID,
			marketAlertsParameters.EVENT_DATE,
			marketAlertsParameters.BASE_CURR,
			marketAlertsParameters.NON_BASE_CURR,
			marketAlertsParameters.EVENT_TYPE_ID,
			marketAlertsParameters.NEW_VALUE,
			marketAlertsParameters.OLD_VALUE,
			marketAlertsParameters.LAST_EVENT_DATE,
			marketAlertsParameters.DIFFERENCE,
			marketAlertsParameters.EVENT_DESCRIPTION
		],
		function(data) {
			data[parametersList.TEST_ENABLED] = true;
			let processedData = marketAlertTranslate(data);
			
		},
		'post',
		'/live/market-trigger/test'
	)	


}

