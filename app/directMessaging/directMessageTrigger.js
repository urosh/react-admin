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
const async = require('async');
const Pushy = require('pushy');
const pushyAPI = new Pushy(config.pushyApiKey);


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
	
	if(!requestData[parameters.messageChannels.ALERT]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	if(!requestData[parameters.messageChannels.MOBILES]) {
		return {
			error: 'Bad data format recieved.'
		}
	}

	return requestData;
}


/*
 * Direct message format:
 * 
 *  "title": "Message title",
 *	"message": "Message",
 *	"data": {
 *		"messageType": "2",
 *		"messageData": {
 *			"screen": "1",
 *			"param": 42
 *		}
 *		
 *	}
 */


module.exports  = (directMessaging, usersManagement) => {
	
	const directMessageSendModule = require('./directMessageSendModule')(directMessaging, usersManagement);

	
	directMessaging.addHttpInEvent({
		name: 'messageSend',
		data: [	parameters.admin.FILTERS ],
		handler: function(req, res, data) {
			
			/*
			 * Making sure we receive data in the correct format
			 *
			 * var message = {
			 *		push: {
			 *			title: {},
			 *			text: {},
			 *			action: {}
			 *		},
			 *		alert: {
			 *			title: {},
			 *			text: {},
			 *			action: {}
			 *		},
			 *		mobile: {
			 *			title: {},
			 *			text: {},
			 *			action: {}
			 *		},
			 *		filters = {
			 *			cultures: filtersMappings.cultures['All cultures'], 
			 *			userType: filtersMappings.userType['All users'],
			 *			testUsers: filtersMappings.testUsers['All users'],
			 *			deviceType: filtersMappings.deviceType['All'],
			 *			selectedUsers: selectedUsers,
			 *		}
			 *	};
			 * 
			 * This message comes directly from the admin panel. 
			 */
			let message = clientMessageValidation(req);
			
			if('error' in message) {
				res.send(message.error);
			}
			
			message.pushServerUrl = 'https://' + req.get('host');
			
			/*
			 * Getting the list or direct message notifications receivers
			 *  
			 *	recipients = {
			 *		alerts: alerts.length,
			 *		push: pushMessages.length,
			 *		mobiles: mobileMessages.length,
			 *		userInfo: {
			 *			alerts: [array of user with sockets ],
			 *			push: [array of push registrations],
			 *			mobiles: [array of mobile registrations],
			 *			pushyMobiles: [array of pushy mobile registrations],
			 *			iosMobiles: [array of ios mobile registrations],
			 * 			androidMobiles: [array of android mobile registrations]		
			 *		}
			 *	}
			 */
			const recipients = usersManagement.usersFiltering.getUsersList(message.filters);
			
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
			 * This data is enough for the message send module
			 * 
			 */
			directMessageSendModule.send(message, recipients.userInfo);
			
			res.send('ok');
		},
		method: 'post',
		url: '/live/client-trigger'
	})

}