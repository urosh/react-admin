"use strict";
const config = require('../config');
const parametersList = config.parametersList;
const marketAlertTranslate = require('./utils/marketAlerts');
const languages = config.languages;
const FCM = require('fcm-push');
const serverKey = 'AIzaSyBuBkx25PYli0uCjdzhp20p9M6CqMibKyc';
const fcm = new FCM(serverKey);
const uidGenerator = require('./utils/uidGenerator');
const _ = require('lodash');

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
			
			const instrument = processedData[parametersList.INSTRUMENT];

			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					const room = language + '-' + parametersList.INSTRUMENT + '-' + instrument;
					
					io.sockets.in(room).emit('market-notification', processedData.socket[language]);
				});

			usersManagement.getMarketAlertPushUsers(instrument)
				.forEach(push => {
					const language = push[parametersList.LANGUAGE];
					let pushMessage =_.cloneDeep(processedData.push[language]);
					pushMessage.to = push[parametersList.TOKEN];
					pushMessage.data[parametersList.MACHINE_HASH] = push[parametersList.MACHINE_HASH];
					pushMessage.data[parametersList.USER_ID] = push[parametersList.USER_ID];
					pushMessage.data.userLoggedIn = push[parametersList.USER_ID];
					pushMessage.data.token = push[parametersList.TOKEN];
					pushMessage.pushServerUrl = 'https://lcl.live.new.com';
					fcm.send(pushMessage, (err, response) => {
						if(err){
							console.log(`FCM-Sending message to browser: [${pushMessage.data.token}]`.red + ` Error: ${err}`);
							const subscriptionData = _.cloneDeep(pushMessage.data);
						}
					})
				});

			usersManagement.getMarketAlertMobileUsers(instrument)
				.forEach(mobile => {
					const language = mobile[parametersList.LANGUAGE];
					let mobileMessage =_.cloneDeep(processedData.mobile[language]);
					mobileMessage.to = mobile[parametersList.TOKEN];
					if(mobile.system === 'ios') {
						mobileMessage['notification'] = {
							title: mobileMessage.title,
							body: mobileMessage.detail,
							sound: 'default'
						}
					}
					fcm.send(mobileMessage, (err, response) => {
					    if (err) {
					    	console.log(`FCM-Sending market alert to mobile: [${mobileMessage.to}].  Error: ${err}`);
					    	return;
					    }
					});
					console.log(mobileMessage);
				})
			
		},
		'post',
		'/live/market-trigger',
		true
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
		'/live/market-trigger/test',
		true
	)	


}

