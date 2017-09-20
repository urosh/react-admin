"use strict";
const parameters = require('../parameters');
const _ = require('lodash');
const config = require('../config');
const languages = Object.keys(config.languages)
					.map(code => config.languages[code]);
const moment = require('moment-timezone');
const uidGenerator = require('../uidGenerator');

const async = require('async');
const Pushy = require('pushy');
const pushyAPI = new Pushy(config.pushyApiKey);

const FCM = require('fcm-push');
const adminFcm = new FCM(config.ADMIN_FCM_SERVER_KEY);
const clientFcm = new FCM(config.CLIENT_FCM_SERVER_KEY);

// Currently maximum size of fcm user array batch
const batchLength = 2;


moment().tz("UTC").format();

const setEventDate = () => moment.utc().format('lll');



/*
 * Preparing mobile android message
 * Because of the way android app is handling notifications
 * it is important to follow this strict format. If any change 
 * to the format is done it should be cordinated with GiniApps.
 *
 * Android app does not want the notification object in its payload. 
 * In order for the app to access the title and the message we have
 * to add them to the data object. This is not the case for iOS
 *
 */
const formatAndroidMobileMessage = (data, language) => {
	return  {
		priority: 'high',
		collapse_key: data.mobile.title[language],
		title: data.mobile.title[language],
		body: data.mobile.text[language],
		data: {
			screen: '1',
			param: '1',
			title: data.mobile.title[language],
			message: data.mobile.text[language],
		},
	
	}
}

/*
 * Preparing mobile iOS message
 * Because of the way iOS app is handling notifications
 * it is important to follow this strict format. If any change 
 * to the format is done it should be cordinated with GiniApps.
 *
 */
const formatIosMobileMessage = (data, language) => {
	return  {
		priority: 'high',
		collapse_key: data.mobile.title[language],
		title: data.mobile.title[language],
		body: data.mobile.text[language],
		data: {
			screen: '1',
			param: '1'
		},
		notification: {
			title: data.mobile.title[language],
			body: data.mobile.text[language]
		}
	}				
}

/*
 * Preparing the pushy message
 */

let pushyOptions = {
    notification: {
        badge: 1,
        priority: 'high',
		collapse_key: 'Market Alert',
    },
};

const formatPushyMobileMessage = (data, language) => {
	pushyOptions.notification.collapse_key = data.mobile.title[language];
	return  {
		message: data.mobile.text[language],
		title: data.mobile.title[language],
		data: {
			screen: '1',
			param: '1'
		}
	};
}

/*
 * Preparing the alert message 
 */
const formatAlertMessage = (message, language) => {
	return {
		message: message[parameters.messageChannels.ALERT].text[language] + setEventDate() + ' GMT',
        url: message.alert.action[language],
        title: message[parameters.messageChannels.ALERT].title[language],
        triggerID: message.triggerID,
        messageTime: message.messageTime
	}
}

// Preparing the push message
const formatPushMessage = (message, language) => {
	
	let result = {
		collapse_key: 'Client Message',
		data: {
			title: message[parameters.messageChannels.PUSH].title[language],
			detail: message[parameters.messageChannels.PUSH].text[language] + '\n\n' + setEventDate() + ' GMT',
			pushUrl: message.push.action[language],
			triggerID: message.triggerID,
			triggerType: 'Client Message',
			pushServerUrl: message.pushServerUrl,
		}
	}

	return result;
}


/*
 * Function for sending the message using fcm. We are sending messages
 * in batches. This means we provide array of user ids instead of sending 
 * them to individual users. 
 * 
 * This particular function is used with async module, that is used
 * to call multiple async calls at once, and then wait for all of them 
 * to finish. 
 * 
 */
const fcmSend = (message, callback) => {
	let result = {
		success: 0,
		failures: 0,
	};
	
	clientFcm.send(message, (err, response) => {
		if(err) {
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

/*
 * Making sure we receive data in the correct format
 *
 * var message = {
 *		push: {
 *			title: {
 *				en: '',
 *				ar: '',
 *				zh-hans: '',
 * 				pl: '' 	
 *			},
 *			text: {...},
 *			action: {...}
 *		},
 *		alert: {
 *			title: {...},
 *			text: {...},
 *			action: {...}
 *		},
 *		mobile: {
 *			title: {...},
 *			text: {...},
 *			action: {...}
 *		}
 *	};
 * 
 * This message comes directly from the admin panel. 
 */
const validateMessages = messages => {
	
	if(!messages.push) return false;
	if(!messages.alert) return false;
	if(!messages.mobile) return false;
	
	let messageParams = ['title', 'text', 'action'];
	let validationSuccess = true;

	messageParams.map(param => {
		if(!messages.push[param]) {
			validationSuccess = false;
			return;
		};
		if(!messages.alert[param]) {
			validationSuccess = false;
			return;
		};
		if(!messages.mobile[param]) {
			validationSuccess = false;
			return;
		};
	})

	if(!validationSuccess) return false;
	// Make sure that if each message has some content it is using the existing language
	messageParams.map(param => {
		Object.keys(messages.push[param])
			.map(key => {
				if(key && !languages.includes(key)) {
					validationSuccess = false;
				}
			})
		Object.keys(messages.alert[param])
			.map(key => {
				if(key && !languages.includes(key)) {
					validationSuccess = false;
				}
			})
		Object.keys(messages.mobile[param])
			.map(key => {
				if(key && !languages.includes(key)) {
					validationSuccess = false;
				}
			})
	})
	if(!validationSuccess) return false;

	return true;

}

/*
 * Getting the list or direct message notifications receivers
 *  
 *	recipients = {
 *		alerts: [array of user with sockets ],
 *		push: [array of push registrations],
 *		mobiles: [array of mobile registrations],
 *		pushyMobiles: [array of pushy mobile registrations],
 *		iosMobiles: [array of ios mobile registrations],
 * 		androidMobiles: [array of android mobile registrations]		
 *	}
 */
const validateRecipients = recipients => {
	if(!recipients) return false;
	if(!recipients.alerts) return false;
	if(!recipients.push) return false;
	if(!recipients.mobiles) return false;
	if(!recipients.pushyMobiles) return false;
	if(!recipients.iosMobiles) return false;
	if(!recipients.androidMobiles) return false;
	return true;
}

/*
 * Helper function that sends the messages in batches. 
 * @param messages Object
 * @param recipients Array array of message recipients
 * @param type Device type (push, ios, android);
 * @return void
 * 
 */
const sendMessages = (messages, recipients, type) => {
	if(!messages) {
		console.log('Direct Messaging: SendMessages function problem. The function is missing messages object.');
		return;
	}
	if(!recipients) {
		console.log('Direct Messaging: SendMessages function problem. The function is missing recipients object.');
		return;
	}
	if(!type) {
		console.log('Direct Messaging: SendMessages function problem. The function is missing type parameter.');
		return;
	}
	
	if(recipients.length === 0) return;
	
	let typeValid = false;
	
	let messageFormats = {
		'ios': formatIosMobileMessage,
		'android': formatAndroidMobileMessage,
		'push': formatPushMessage
	};

	Object.keys(messageFormats)
		.map(key => {
			if(key === type){
				typeValid = true;
			}
		})	
	
	if(!typeValid) {
		console.log('Direct Messaging: SendMessages function problem. Parameter type is not correct.');
	}
	
	if(!validateMessages(messages)){
		console.log('Direct Messaging: SendMessages function problem. Messages object is not correct');
	}

	let tokens = {};
	let calls = [];
	let sendMessages = {};
	
	

	// Go through mobile message languages and initalize message and token objects
	let messageType = type;
	
	if(type !== 'push'){
		messageType = 'mobile';
	}

	Object.keys(messages[messageType].text)
		.map(language => {
			sendMessages[language] = messageFormats[type](messages, language);
			tokens[language] = [];
		})

		recipients.map(user => {
			let language = user[parameters.user.LANGUAGE];
			tokens[language].push(user[parameters.messageChannels.TOKEN]);
		});

		// Create batches and prepare send calls
		Object.keys(tokens)
			.map(language => {
				// Calculate number of batches for specific language
				let iterationsNumber = Math.ceil(tokens[language].length / batchLength);
				// For each batch create send call that is used by async	
				for(let i = 0; i < iterationsNumber; i++){
					let message = Object.assign({}, sendMessages[language]);
					message.dry_run = false;
					message.registration_ids = 	tokens[language].slice( i * batchLength, batchLength * ( i + 1) );
					// Add send call
					calls.push(fcmSend.bind(null, message));	
				}
			});

		// Sending the browser push using async call
		if(calls.length){
			async.series(calls, function(err, res){
				if(err){
					console.log('Direct Messaging: Error while trying to send direct message to ' + type+ ' users' , err);
					return;
				}
				
				var result = res.reduce((curr, next) => {
					if(!curr) return next;
					next.success = curr.success +	next.success;
					next.failures = curr.failures + next.failures;
					return next;
				});
				
				console.log('Direct messages: Sending direct messages to '+ type +' users [success] [failures]',result.success, result.failures);
			})
		}
}

/*
 * DirecMessageSendModule sends direct messages to all available devices, and to all 
 * the users provided in the recipients list. It is the responsibility of whoever is calling
 * the module to preapare the list and messages in the correct format. 
 *
 * Messages are organized by message type (alert, mobile, push), and for each message 
 * type we provide title, text and action. Action holds screen number and any other 
 * parameters that is needed by the app. 
 *
 * Recipients list provides list of users for each message type, and for each mobile
 * delivery method. 
 */
module.exports = (directMessaging, usersManagement) => {
	
	const send = (messages, recipients) => {
		if(!validateMessages(messages)){
			console.log('Direct Messaging Error: There was a problem with provided messages format');
			return;
		}

		if(!validateRecipients(recipients)){
			console.log('Direct Messaging Error: There was a problem with provided recipients format');
			return;
		}

		messages.triggerRecievedTime = new Date();
		messages.messageTime =  setEventDate() + ' GMT';
		messages.triggerID = uidGenerator();

		// If provided data is valid we can go on and start the sending process

		let io = directMessaging.getSocketsConnection();
		let pub = directMessaging.getRedisConnection();
		let	alertMessagesText,
			pushMessagesText,
			mobileMessagesText;
			
		// Get individual messages
		alertMessagesText = messages[parameters.messageChannels.ALERT].text;
		
		pushMessagesText = messages[parameters.messageChannels.PUSH].text;
		
		mobileMessagesText = messages[parameters.messageChannels.MOBILES].text;
		
		/*
		 * Sending Direct Message Alerts
		 */
		Object.keys(alertMessagesText)
			.map(language => {
				recipients.alerts.map(user => {
					let parameter = usersManagement.getIdParameter(user);
					// Publish user's data over redis
					pub.publish('sendSocketMessage', JSON.stringify({
						room: language + '-' + user[parameter],
						eventName: 'client-notification',
						data: formatAlertMessage(messages, language),
						action: messages[parameters.messageChannels.ALERT].action[language]
					}));
				})
			})	
		
		/*
		 * Prepare and send browser push notifications
		 */
		sendMessages(messages, recipients.push, 'push');
		sendMessages(messages, recipients.iosMobiles, 'ios');
		sendMessages(messages, recipients.androidMobiles, 'android');
		
	}
	return {
		send: send
	}
}
	
	