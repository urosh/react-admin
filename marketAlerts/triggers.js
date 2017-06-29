"use strict";
const marketAlertsConfig = require('./config');
const generalConfig = require('../config');
const marketAlertsParameters = marketAlertsConfig.parametersList;
const uidGenerator = require('../utils/uidGenerator');
const marketAlertTranslate = require('./utils/marketAlerts');

module.exports = (marketAlerts) => {
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
			console.log('We recieved market alert');
			console.log(processedData);
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
			console.log('We recieved market alert');
			console.log(processedData);
		},
		'post',
		'/live/market-trigger/test'
	)	


}

