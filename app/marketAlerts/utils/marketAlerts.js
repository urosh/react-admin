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
 */
const config = require('../../config');
const eventList = config.eventList;
const parametersList = config.parametersList;
const uidGenerator = require('./uidGenerator');
const languages = config.languages;
const _ = require('lodash');
const pushMessageTemplate = {
	to: '',
	collapse_key: 'Market Alert',
	data: {
		title: '',
		detail: '',
		messageType: 'Market Alert',
		socketMessage: '',
		pushUrl: '',
		triggerID: '',
		machineHash: '',
		userID: '',
		userLoggedIn: '',
		pushServerUrl: '',
		instrument: '',
		token: '',
		messageType: ''
	}
};

const socketMessageTemplate = {
	message: '',
	url: '',
	title: '',
	type: '',
	triggerID: '',
	instrument: ''
};

const mobileTemplate = {
	to: '',
	priority: 'high',
	collapse_key: 'Market Alert',
	data: {
		screen: '1',
		pair: '',
		title: '',
		detail: ''
	}
};


const roundToTwo = value => (Math.round(value * 100) / 100);

const setInstrument = data => data[parametersList.BASE_CURR] + '/' + data[parametersList.NON_BASE_CURR];

// Instrument based url
const setNotificationAction = data =>  {
	
	const actionUrl = '/trade/' + data[parametersList.BASE_CURR].toLowerCase() + '-' + data[parametersList.NON_BASE_CURR].toLowerCase() + '/';
	
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


const setEventDate = data =>  {
	return 	data[parametersList.EVENT_DATE]
		.split(' ')
		.map(function(item){
			if(item.indexOf('-') > -1){
				return item.split('-').reverse().join('/');
			}
			return item;
		}).join(' ');
}



// Formating notification message based on recieved data
const setPushMessage = (data, language, inst) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = inst;

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	
	const date = setEventDate(data) + ' GMT';
	let message = '';
	if(eventNumber === 1 || eventNumber === 2) {
		
		let diff = data[parametersList.DIFFERENCE];
		let sign = data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE] ? '+' : '-'
		diff = sign + diff + '%';
		
		const message = instrument.toUpperCase() + ' at ' + instrumentPrice +  ' (' + diff + ') ' + '\n\n' + date;
		return message;
	}else{
		return instrument.toUpperCase() + ' ' + eventList[eventNumber].message[language] + ' (' + instrumentPrice + ')' + '\n' + date;
	}
}

const setSocketMessages = (data, language, inst) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = inst;

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	const date = '<span class="eventDate">' +  setEventDate(data) + ' GMT</span>';

	let message;
	
	if (eventNumber === 1 || eventNumber === 2){
		
		let diff = data[parametersList.DIFFERENCE];
		let sign = data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE] ? '+' : '-';
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
	
	if(data[parametersList.TEST_ENABLED]) {
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

	alertData.mobile = {
		[languages.EN]: _.cloneDeep(mobileTemplate),
		[languages.PL]: _.cloneDeep(mobileTemplate),
		[languages.AR]: _.cloneDeep(mobileTemplate),
		[languages.ZH_HANS]: _.cloneDeep(mobileTemplate),
	}

    var eventNumber = parseInt(requestData[parametersList.EVENT_TYPE_ID], 10);
	
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
			// Set push notification message
			alertData.push[language].data[parametersList.INSTRUMENT] = instrument;
			alertData.push[language].data['messageType'] = eventList[eventNumber][parametersList.TYPE];
			alertData.push[language].data['detail'] = setPushMessage(requestData, language, instrument);
			alertData.push[language].data['title'] = setNotificationTitle(requestData, language);
			alertData.push[language].data['pushUrl'] = setNotificationAction(requestData).push;
			alertData.push[language].data[parametersList.PUSH_SERVER_URL] = requestData.host;
			alertData.push[language].data[parametersList.TRIGGER_ID] = triggerID;
			alertData.push[language].data[parametersList.TRIGGER_TYPE] = parametersList.MARKET_ALERT;

			// Set socket message
			alertData.socket[language][parametersList.INSTRUMENT] = instrument;
			alertData.socket[language][parametersList.TYPE] = eventList[eventNumber][parametersList.TYPE];
			alertData.socket[language]['message'] = setSocketMessages(requestData, language, instrument);
			alertData.socket[language]['title'] = setNotificationTitle(requestData, language);
			alertData.socket[language]['url'] = setNotificationAction(requestData).socket[language];
			alertData.socket[language][parametersList.TRIGGER_ID] = triggerID;
			alertData.socket[language][parametersList.TRIGGER_TYPE] = parametersList.MARKET_ALERT;
			
			// Set mobile message
			alertData.mobile[language].data['pair'] = instrument;
			alertData.mobile[language].data['title'] = setNotificationTitle(requestData, language);
			alertData.mobile[language].data['detail'] = setPushMessage(requestData, language, instrument);
			alertData.mobile[language].data[parametersList.TRIGGER_ID] = triggerID;
			alertData.mobile[language].data[parametersList.TRIGGER_TYPE] = parametersList.MARKET_ALERT;
		});

		alertData[parametersList.INSTRUMENT] = instrument;

	
	/* alertData[parametersList.TRIGGER_RECIEVED_TIME] = new Date();
    	alertData[parametersList.TRIGGER_ID] = uidGenerator();;
	*/
	

   	return alertData;
};

