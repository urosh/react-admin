"use strict";
const config = require('../config');
const parameters = require('../parameters');
const marketAlertTranslate = require('./triggerMessageTransformation');
const languages = config.languages;
const FCM = require('fcm-push');
const fcm = new FCM(config.CLIENT_FCM_SERVER_KEY);
const uidGenerator = require('../uidGenerator');
const _ = require('lodash');
const async = require('async');
const Pushy = require('pushy');
const pushyAPI = new Pushy('dd7c8bda5b8ed823bc1ddea885ed0d73f89bd79dbbb75d0581becf4a634c62d0');


const fcmSend = (message, callback) => {
	let result = {
		success: 0,
		failures: 0,
	};
	
	fcm.send(message, (err, response) => {
		if(err) {
			console.log(`FCM Error-Sending market alerts to [${lang}] ios devices`);
			// or should i pass all the results?
			callback(null, result);
			return
		}
		try{
			let responseObject = JSON.parse(response);
			result.success = responseObject.success;
			result.failures = responseObject.failure;
			
			callback(null, result);
		}
		catch(err){
			callback(null, result);
		}
	})
}

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
		function(req, res, data) {
			
			res.send('Market Alert data received successfully');

			let processedData = marketAlertTranslate(data);
			//console.log(processedData);
			let pub =  marketAlerts.getRedisConnection();

			//console.log(processedData);

			const instrument = processedData[parameters.user.INSTRUMENT];
			
			let marketAlertReceivers = usersManagement.getMarketAlertReceivers(instrument);
			console.log(marketAlertReceivers);
			return;
			//let marketAlertPushUsers = usersManagement.getMarketAlertPushUsers(instrument);
			
			//let marketAlertMobileUsers = usersManagement.getMarketAlertMobileUsers(instrument);
			const pushyOptions = {
			    notification: {
			        badge: 1,
			        priority: 'high',
					collapse_key: 'Market Alert',
			    },
			};

			let browserPushCalls = [];
			let mobilePushCalls = [];

			Object.keys(languages)
				.map(code => languages[code])
				.forEach(language => {
					// Socket messages are sent on receiving redis event, since each server
					// has to handle its own socket connections. 
					const room = language + '-' + parameters.user.INSTRUMENT + '-' + instrument;
					// Publish user's data over redis
					pub.publish('sendSocketMessage', JSON.stringify({
						room: room,
						eventName: 'market-notification',
						data: processedData.socket[language]
					}));
					
					console.log('We are populating our arrays');
					let pushIterationsNumber = Math.ceil(marketAlertReceivers.push[language].length / 1000);
					
					let  mobileIterationNumber = Math.ceil(marketAlertReceivers.fcmMobile[language].length / 1000);
					
					console.log(pushIterationsNumber);
					console.log(mobileIterationNumber);

					for (let i = 0; i < pushIterationsNumber; i++) {
						let message = Object.assign({}, processedData.push[language]);
						message.dry_run = true;
						message.registration_ids = marketAlertReceivers.push[language].slice(i*1000, 1000*(i+1));
						browserPushCalls.push(fcmSend.bind(null, message));
					}

					for (let i = 0; i < mobileIterationNumber; i++) {
						let message = Object.assign({}, processedData.fcmMobile[language]);
						message.dry_run = true;
						message.registration_ids = marketAlertReceivers.fcmMobile[language].length.slice(i*1000, 1000*(i+1));
						mobilePushCalls.push(fcmSend.bind(null, message));
					}

					
					// Send to pushy devices
					if(marketAlertReceivers.pushyMobile[language].length){
						/*pushyAPI.sendPushNotification(processedData.pushyMobile[language], marketAlertReceivers.pushyMobile[language], pushyOptions, function(err, id) {
							if(err) {
								console.log(`Pushy Error: There was an error while trying to send a message to [${lang}] pushy`, err);
								return;
							}
							console.log(`Pushy Sending market alerts to [${language}] devices`);
						});*/
						
					}

				});
			
			console.log('Browser push calls, mobile push calls', browserPushCalls.length, mobilePushCalls.length);
			// Start sending push notifications to browser
			if(browserPushCalls.length){
				async.series(browserPushCalls, function(err, res){
					if(err){
						console.log('Market Alerts: There was an error while sending market alert push notification to the browsers', err);
						return;
					}
					console.log(res)
					var result = res.reduce((curr, next) => {
						if(!curr) return next;
						next.success = curr.success +	next.success;
						next.failures = curr.failures + next.failures;
						return next;
					});
					
					result.invalidTokensLength = result.invalidTokens.length;
					
					console.log('Market Alerts: Sending push notification market alerts to browsers [success] [failures]',result.success, result.failures);
				})
			}
			
			// Start sending push notifications to mobiles
			if(mobilePushCalls.length){
				async.series(mobilePushCalls, function(err, res){
					if(err){
						console.log('Market Alerts: There was an error while sending market alerts to mobiles using FCM', err);
						return;
					}
					var result = res.reduce((curr, next) => {
						if(!curr) return next;
						next.success = curr.success +	next.success;
						next.failures = curr.failures + next.failures;
						return next;
					});
					
					console.log('Market Alerts: Sending push notification market alerts to mobiles [success] [failures]',result.success, result.failures);
					
				})
			}

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
		function(req, res, data) {
			res.send('Test Market Alert request received');

			data[parameters.user.TEST_ENABLED] = true;
			let processedData = marketAlertTranslate(data);
			let io = marketAlerts.getSocketsConnection();
		},
		'post',
		'/live/market-trigger/test'
	)




}

