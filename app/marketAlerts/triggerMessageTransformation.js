"use strict";
/**
 * Trigger Market Alerts
 * 
 * Working JSON format :
 * {  
 *  	"data":{  
 *     		"row_id":"11",
 *     		"event_id":"7257-1",
 *     		"event_date":"2016-06-05 11:02:26",
 *     		"base_curr":"EUR",
 *     		"non_base_curr":"USD",
 *     		"event_type_id":"3",
 *     		"new_value":"1.01149",
 *     		"old_value":"1.01455",
 *     		"last_event_date":"2015-07-06 00:00:00",
 *     		"difference":"0"
 *     		"event_description":"365 Days Min Low Changed"
 *  	}
 * }
 * 
 * TriggerMessageTransformation transforms market alert triggers received from 
 * webeyez to the suitable format we can use to send message to  the users 
 * using three main channels: sockets, browser push and mobile push. 
 * 
 * Each channel needs to have the data in the specific format. 
 * 
 * Single function that takes input data is exposed. It returns alertData object that  holds
 * message objects for each type of channel and for each language. 
 *
 */
const config = require('../config');
const eventList = config.eventList;
const parameters = require('../parameters');
const uidGenerator = require('../uidGenerator');
const languages = config.languages;
const _ = require('lodash');

// Push message template
const pushMessageTemplate = {
	collapse_key: 'Market Alert',
	data: {
		[parameters.marketAlerts.TITLE]: '',
		[parameters.marketAlerts.DETAIL]: '',
		[parameters.marketAlerts.MESSAGE_TYPE]: 'Market Alert',
		[parameters.marketAlerts.SOCKET_MESSAGE]: '',
		[parameters.marketAlerts.PUSH_URL]: '',
		[parameters.tracking.TRIGGER_ID]: '',
		[parameters.messageChannels.MACHINE_HASH]: '',
		[parameters.user.USER_ID]: '',
		[parameters.user.USER_LOGGED_IN]: '',
		[parameters.tracking.PUSH_SERVER_URL]: '',
		[parameters.user.INSTRUMENT]: '',
		[parameters.messageChannels.TOKEN]: '',
	}
};

// Socket message template
const socketMessageTemplate = {
	[parameters.marketAlerts.MESSAGE]: '',
	[parameters.general.URL]: '',
	[parameters.marketAlerts.TITLE]: '',
	[parameters.marketAlerts.TYPE]: '',
	[parameters.tracking.TRIGGER_ID]: '',
	[parameters.user.INSTRUMENT]: ''
};

// Mobile message template
const mobileFcmTemplate = {
	priority: 'high',
	collapse_key: 'Market Alert',
	data: {
		[parameters.general.SCREEN]: '1',
		[parameters.user.PAIR]: '',
		[parameters.marketAlerts.TITLE]: '',
		[parameters.marketAlerts.DETAIL]: ''
	},
	notification: {
		[parameters.marketAlerts.TITLE]: '',
		[parameters.marketAlerts.BODY]: '',
		[parameters.messageChannels.SOUND]: 'default'
	},
	dry_run: true
};

// Pushy template
const mobilePushyTemplate = {
	'screen': '1',
	'pair': '',
	'message': '',
	'title': ''
};


// Utility function, rounding decimal values to two digits
const roundToTwo = value => (Math.round(value * 100) / 100);

// Set correct instrument format from received data
const setInstrument = data => data[parameters.marketAlerts.BASE_CURR] + '/' + data[parameters.marketAlerts.NON_BASE_CURR];

// Instrument based url
const setNotificationAction = data =>  {
	
	const actionUrl = '/trade/' + data[parameters.marketAlerts.BASE_CURR].toLowerCase() + '-' + data[parameters.marketAlerts.NON_BASE_CURR].toLowerCase() + '/';
	
	return {
		push: actionUrl,
		socket: {
			[languages.EN]: actionUrl,
			[languages.PL]: '/' + languages.PL +  actionUrl,
			[languages.AR]: '/' + languages.AR +  actionUrl,
			[languages.ZH_HANS]: '/' + languages.ZH_HANS + actionUrl
		}
	}
}

// Utility function that sets correct event data format
const setEventDate = data =>  {
	return 	data[parameters.marketAlerts.EVENT_DATE]
		.split(' ')
		.map(function(item){
			if(item.indexOf('-') > -1){
				return item.split('-').reverse().join('/');
			}
			return item;
		}).join(' ');
}



// Formating notification message based on recieved data
const setPushMessage = (data, language, _instrument) => {
	// Process input data and get event number, instrument price and event date
	const eventNumber = parseInt(data[parameters.marketAlerts.EVENT_TYPE_ID], 10);
	
	const instrument = _instrument;

	const instrumentPrice = Math.round(data[parameters.marketAlerts.NEW_VALUE] * 10000) / 10000;
	
	const date = setEventDate(data) + ' GMT';
	
	// Initialize push message
	let message = '';
	// Set the alert text based on the event number and language
	if(eventNumber === 1 || eventNumber === 2) {
		
		let diff = data[parameters.marketAlerts.DIFFERENCE];
		let sign = data[parameters.marketAlerts.NEW_VALUE] > data[parameters.marketAlerts.OLD_VALUE] ? '+' : '-'
		diff = sign + diff + '%';
		
		const message = instrument.toUpperCase() + ' at ' + instrumentPrice +  ' (' + diff + ') ' + '\n\n' + date;
		return message;
	}else{
		return instrument.toUpperCase() + ' ' + eventList[eventNumber].message[language] + ' (' + instrumentPrice + ')' + '\n' + date;
	}
}

// Set socket messagew
const setSocketMessages = (data, language, _instrument) => {
	// Process input data and get event number, instrument price and event date
	const eventNumber = parseInt(data[parameters.marketAlerts.EVENT_TYPE_ID], 10);
	
	const instrument = _instrument;

	const instrumentPrice = Math.round(data[parameters.marketAlerts.NEW_VALUE] * 10000) / 10000;
	
	const date = '<span class="eventDate">' +  setEventDate(data) + ' GMT</span>';
	
	let message;
	
	if (eventNumber === 1 || eventNumber === 2){
		
		let diff = data[parameters.marketAlerts.DIFFERENCE];
		let sign = data[parameters.marketAlerts.NEW_VALUE] > data[parameters.marketAlerts.OLD_VALUE] ? '+' : '-';
		diff = sign + diff + '%';

		message = '<span dir="ltr"><strong>' + instrument.toUpperCase() + ' at ' + instrumentPrice + '</strong> ' + ' (' + diff + ')</span> ';
		
		return message = message + '<br>' + date;
	
	}else{
		return '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message[language] + ' (' + instrumentPrice + ')' + '<br>' + date;
	}
}

// Multilingual notification title, shoould go to the server
const setNotificationTitle = (data, language) => {
	let title = {
		[languages.EN]: '',
		[languages.PL]: '',
		[languages.AR]: '',
		[languages.ZH_HANS]: ''
	}
	
	if(data[parameters.user.TEST_ENABLED]) {
		title[languages.EN] = 'Testing Market Notification';
		title[languages.PL] = 'Testing Notyfikacja z Rynku';
		title[languages.AR] = 'testing إخطارات السوق';
		title[languages.ZH_HANS] = 'Testing 市场价格提醒';
	}else{
		title[languages.EN] = 'Market Notification';
		title[languages.PL] = 'Notyfikacja z Rynku';
		title[languages.AR] = 'إخطارات السوق';
		title[languages.ZH_HANS] = '市场价格提醒';
	}

	return title[language];
};


// Translate recieved data to a format used on client side
module.exports = function(requestData) {
	
	// Default no error
	var alertData = {};
	
	alertData.push = {
		[languages.EN]: _.cloneDeep(pushMessageTemplate),
		[languages.PL]: _.cloneDeep(pushMessageTemplate),
		[languages.AR]: _.cloneDeep(pushMessageTemplate),
		[languages.ZH_HANS]: _.cloneDeep(pushMessageTemplate)
	};

	alertData.socket = {
		[languages.EN]: _.cloneDeep(socketMessageTemplate),
		[languages.PL]: _.cloneDeep(socketMessageTemplate),
		[languages.AR]: _.cloneDeep(socketMessageTemplate),
		[languages.ZH_HANS]: _.cloneDeep(socketMessageTemplate),
	};

	alertData.fcmMobile = {
		[languages.EN]: _.cloneDeep(mobileFcmTemplate),
		[languages.PL]: _.cloneDeep(mobileFcmTemplate),
		[languages.AR]: _.cloneDeep(mobileFcmTemplate),
		[languages.ZH_HANS]: _.cloneDeep(mobileFcmTemplate),
	}

	alertData.pushyMobile = {
		[languages.EN]: _.cloneDeep(mobilePushyTemplate),
		[languages.PL]: _.cloneDeep(mobilePushyTemplate),
		[languages.AR]: _.cloneDeep(mobilePushyTemplate),
		[languages.ZH_HANS]: _.cloneDeep(mobilePushyTemplate),
	}

    var eventNumber = parseInt(requestData[parameters.marketAlerts.EVENT_TYPE_ID], 10);
	
	if (typeof eventList[eventNumber] === 'undefined') {
		var error = new Error();
		error.status = 500;
		error.message = 'Requested data is not valid, invalid event type number';
		return {
			error: error
		}
	}

	const instrument = setInstrument(requestData);
	let currentLanguage;
	const triggerID = uidGenerator();
	Object.keys(alertData.push)
		.forEach(language => {
			let pushMessage = setPushMessage(requestData, language, instrument);
			let notificationTitle = setNotificationTitle(requestData, language);
			let socketMessage = setSocketMessages(requestData, language, instrument);
			let notificationAction = setNotificationAction(requestData)
			
			// Set push notification message
			alertData.push[language].data[parameters.user.INSTRUMENT] = instrument;
			alertData.push[language].data['messageType'] = eventList[eventNumber][parameters.marketAlerts.TYPE];
			alertData.push[language].data['detail'] = pushMessage;
			alertData.push[language].data['title'] = notificationTitle;
			alertData.push[language].data['pushUrl'] = notificationAction.push;
			alertData.push[language].data[parameters.tracking.PUSH_SERVER_URL] = requestData.host;
			alertData.push[language].data[parameters.tracking.TRIGGER_ID] = triggerID;
			alertData.push[language].data[parameters.tracking.TRIGGER_TYPE] = parameters.tracking.MARKET_ALERT;

			// Set socket message
			alertData.socket[language][parameters.user.INSTRUMENT] = instrument;
			alertData.socket[language][parameters.marketAlerts.TYPE] = eventList[eventNumber][parameters.marketAlerts.TYPE];
			alertData.socket[language]['message'] = socketMessage;
			alertData.socket[language]['title'] = notificationTitle;
			alertData.socket[language]['url'] = notificationAction.socket[language];
			alertData.socket[language][parameters.tracking.TRIGGER_ID] = triggerID;
			alertData.socket[language][parameters.tracking.TRIGGER_TYPE] = parameters.tracking.MARKET_ALERT;
			
			// Set mobile fcm message
			alertData.fcmMobile[language].data['pair'] = instrument;
			alertData.fcmMobile[language].data['title'] = notificationTitle;
			alertData.fcmMobile[language].data['detail'] = pushMessage;
			alertData.fcmMobile[language].notification[parameters.marketAlerts.TITLE] = notificationTitle;
			alertData.fcmMobile[language].notification[parameters.marketAlerts.BODY] = pushMessage;
			alertData.fcmMobile[language].data[parameters.tracking.TRIGGER_ID] = triggerID;
			alertData.fcmMobile[language].data[parameters.tracking.TRIGGER_TYPE] = parameters.tracking.MARKET_ALERT;
			
			// Set mobile pushy message
			alertData.pushyMobile[language].pair = instrument;
			alertData.pushyMobile[language].title = notificationTitle;
			alertData.pushyMobile[language].message = pushMessage;
		});

	alertData[parameters.user.INSTRUMENT] = instrument;
	
	return alertData;
};

