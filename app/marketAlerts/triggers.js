"use strict";
const config = require('../config');
const parameters = require('../parameters');
const marketAlertTranslate = require('./triggerMessageTransformation');
const languages = config.languages;
const FCM = require('fcm-push');
const fcm = new FCM(config.CLIENT_FCM_SERVER_KEY);
const uidGenerator = require('../uidGenerator');
const _ = require('lodash');

module.exports = (marketAlerts, usersManagement) => {
	
	marketAlerts.addHttpInEvent(
		'marketAlertTrigger',
		[
			parameters.marketAlerts.ROW_ID,
			parameters.marketAlerts.EVENT_ID,
			parameters.marketAlerts.EVENT_DATE,
			parameters.marketAlerts.BASE_CURR,
			parameters.marketAlerts.NON_BASE_CURR,
			parameters.marketAlerts.EVENT_TYPE_ID,
			parameters.marketAlerts.NEW_VALUE,
			parameters.marketAlerts.OLD_VALUE,
			parameters.marketAlerts.LAST_EVENT_DATE,
			parameters.marketAlerts.DIFFERENCE,
			parameters.marketAlerts.EVENT_DESCRIPTION
		],
		function(data) {
			let processedData = marketAlertTranslate(data);
			
			let io = marketAlerts.getSocketsConnection();
			
			const instrument = processedData[parameters.user.INSTRUMENT];

			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					const room = language + '-' + parameters.user.INSTRUMENT + '-' + instrument;
					io.sockets.in(room).emit('market-notification', processedData.socket[language]);
				});

			usersManagement.getMarketAlertPushUsers(instrument)
				.forEach(push => {
					const language = push[parameters.user.LANGUAGE];
					let pushMessage =_.cloneDeep(processedData.push[language]);
					pushMessage.to = push[parameters.messageChannels.TOKEN];
					pushMessage.data[parameters.messageChannels.MACHINE_HASH] = push[parameters.messageChannels.MACHINE_HASH];
					pushMessage.data[parameters.user.USER_ID] = push[parameters.user.USER_ID];
					pushMessage.data.userLoggedIn = push[parameters.user.USER_ID];
					pushMessage.data.token = push[parameters.messageChannels.TOKEN];
					fcm.send(pushMessage, (err, response) => {
						if(err){
							console.log(`FCM-Sending message to browser: [${pushMessage.data.token}]`.red + ` Error: ${err}`);
							const subscriptionData = _.cloneDeep(pushMessage.data);
						}
					})
				});

			usersManagement.getMarketAlertMobileUsers(instrument)
				.forEach(mobile => {
					const language = mobile[parameters.user.LANGUAGE];
					let mobileMessage =_.cloneDeep(processedData.mobile[language]);
					mobileMessage.to = mobile[parameters.user.TOKEN];
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
					
				})
			
		},
		'post',
		'/live/market-trigger'
	)

	marketAlerts.addHttpInEvent(
		'marketAlertTriggerTest',
		[
			parameters.marketAlerts.ROW_ID,
			parameters.marketAlerts.EVENT_ID,
			parameters.marketAlerts.EVENT_DATE,
			parameters.marketAlerts.BASE_CURR,
			parameters.marketAlerts.NON_BASE_CURR,
			parameters.marketAlerts.EVENT_TYPE_ID,
			parameters.marketAlerts.NEW_VALUE,
			parameters.marketAlerts.OLD_VALUE,
			parameters.marketAlerts.LAST_EVENT_DATE,
			parameters.marketAlerts.DIFFERENCE,
			parameters.marketAlerts.EVENT_DESCRIPTION
		],
		function(data) {
			data[parameters.user.TEST_ENABLED] = true;
			let processedData = marketAlertTranslate(data);
			let io = marketAlerts.getSocketsConnection();
		},
		'post',
		'/live/market-trigger/test'
	)




}

