"use strict";
const config = require('../config');
const parameters = require('../parameters');
const marketAlertTranslate = require('./triggerMessageTransformation');
const languages = config.languages;
const FCM = require('fcm-push');
const fcm = new FCM(config.clientFcmServerKey);
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
			console.log(err);
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
	
	marketAlerts.addHttpInEvent({
		name: 'marketAlertTrigger',
		data: [
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
		handler: function(req, res, data) {
			
			res.send('Market Alert data received successfully');

			let processedData = marketAlertTranslate(data);
			//console.log(processedData);
			let pub =  marketAlerts.getRedisConnection();

			const instrument = processedData[parameters.user.INSTRUMENT];
			
			// Send the instrument to users management and get the list of receiving tokens arranged by device
			// delivery method and language
			let marketAlertReceivers = usersManagement.getMarketAlertReceivers(instrument);
			// Prepare push options
			const pushyOptions = {
			    notification: {
			        badge: 1,
			        priority: 'high',
					collapse_key: 'Market Alert',
			    },
			};

			let browserPushCalls = [];
			let mobileAndroidPushCalls = [];
			let mobileIosPushCalls = [];

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
					
					/*
					 * Creating fcm push batches of 1000. For each language we create the batch with the 
					 * array of tokens and assign appropriate message to this token. Grouping logic is 
					 * following: All devices with the same language and same 
					 */

					let pushIterationsNumber = Math.ceil(marketAlertReceivers.push[language].length / 1000);
					
					let  mobileIosIterationNumber = Math.ceil(marketAlertReceivers.fcmIosMobile[language].length / 1000);
					
					let  mobileAndroidIterationNumber = Math.ceil(marketAlertReceivers.fcmAndroidMobile[language].length / 1000);
					
					for (let i = 0; i < pushIterationsNumber; i++) {
						let message = Object.assign({}, processedData.push[language]);
						message.dry_run = false;
						message.registration_ids = marketAlertReceivers.push[language].slice(i*1000, 1000*(i+1));
						browserPushCalls.push(fcmSend.bind(null, message));
					}

					for (let i = 0; i < mobileIosIterationNumber; i++) {
						let message = Object.assign({}, processedData.fcmIosMobile[language]);
						message.dry_run = false;
						message.registration_ids = marketAlertReceivers.fcmIosMobile[language].slice(i*1000, 1000*(i+1));
						mobileIosPushCalls.push(fcmSend.bind(null, message));
					}
					
					for (let i = 0; i < mobileAndroidIterationNumber; i++) {
						let message = Object.assign({}, processedData.fcmAndroidMobile[language]);
						message.dry_run = false;
						message.registration_ids = marketAlertReceivers.fcmAndroidMobile[language].slice(i*1000, 1000*(i+1));
						mobileAndroidPushCalls.push(fcmSend.bind(null, message));
					}
					


					// Send to pushy devices
					if(marketAlertReceivers.pushyMobile[language].length){
						pushyAPI.sendPushNotification(processedData.pushyMobile[language], marketAlertReceivers.pushyMobile[language], pushyOptions, function(err, id) {
							if(err) {
								console.log(`Pushy Error: There was an error while trying to send a message to [${language}] pushy`, err);
								return;
							}
							console.log(`Pushy Sending market alerts to [${language}] devices`);
						});
						
					}

				});
			
			// Start sending push notifications to browser
			if(browserPushCalls.length){
				async.series(browserPushCalls, function(err, res){
					if(err){
						console.log('Market Alerts: There was an error while sending market alert push notification to the browsers', err);
						return;
					}
					
					var result = res.reduce((curr, next) => {
						if(!curr) return next;
						next.success = curr.success +	next.success;
						next.failures = curr.failures + next.failures;
						return next;
					});
					
					console.log('Market Alerts: Sending push notification market alerts to browsers [success] [failures]',result.success, result.failures);
				})
			}
			
			// Start sending push notifications to ios mobiles
			if(mobileIosPushCalls.length){
				async.series(mobileIosPushCalls, function(err, res){
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

			// Start sending push notifications to android mobiles
			if(mobileAndroidPushCalls.length){
				async.series(mobileAndroidPushCalls, function(err, res){
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
		method: 'post',
		url: '/live/market-trigger'
	})

	marketAlerts.addHttpInEvent({
		name: 'marketAlertTriggerTest',
		data: [
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
		handler: function(req, res, data) {
			res.send('Test Market Alert request received');

			data[parameters.user.TEST_ENABLED] = true;
			let processedData = marketAlertTranslate(data);
			let io = marketAlerts.getSocketsConnection();
		},
		method: 'post',
		url: '/live/market-trigger/test'
	})

}

