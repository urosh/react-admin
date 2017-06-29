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
const constants = require('../config');
const eventList = constants.eventList;
const parametersList = constants.parametersList;
const uidGenerator = require('../../utils/uidGenerator');
const languages = constants.languages;

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
const setPushMessage = (data, alertData) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = alertData[parametersList.INSTRUMENT];

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	alertData.push = {
		[languages.EN]: '',
		[languages.PL]: '',
		[languages.AR]: '',
		[languages.ZH_HANS]: ''
	}
	const date = setEventDate(data) + ' GMT';
	let message = '';
	if(eventNumber === 1 || eventNumber === 2) {
		
		let diff = data[parametersList.DIFFERENCE];
		let sign = data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE] ? '+' : '-'
		diff = sign + diff + '%';
		
		const message = instrument.toUpperCase() + ' at ' + instrumentPrice +  ' (' + diff + ') ' + '\n\n' + date;
		
		Object.keys(languages)
			.map(language => languages[language])
			.forEach(language => {
				alertData.push[language] = message;
			})
	
	}else{
		Object.keys(languages)
			.map(language => languages[language])
			.forEach(language => {
			alertData.push[language] = instrument.toUpperCase() + ' ' + eventList[eventNumber].message[language] + ' (' + instrumentPrice + ')' + '\n' + date;
		})
	}

}

const setSocketMessages = (data, alertData) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = alertData[parametersList.INSTRUMENT];

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	const date = '<span class="eventDate">' +  setEventDate(data) + ' GMT</span>';

	alertData.socket = {
		[languages.EN]: '',
		[languages.PL]: '',
		[languages.AR]: '',
		[languages.ZH_HANS]: ''
	}

	let message;
	
	if (eventNumber === 1 || eventNumber === 2){
		
		let diff = data[parametersList.DIFFERENCE];
		let sign = data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE] ? '+' : '-';
		diff = sign + diff + '%';

		message = '<span dir="ltr"><strong>' + instrument.toUpperCase() + ' at ' + instrumentPrice + '</strong> ' + ' (' + diff + ')</span> ';
		
		message = message + '<br>' + date;
		Object.keys(languages)
			.map(language => languages[language])
			.forEach(language => {
			alertData.socket[language] = message;
		})

	}else{
		Object.keys(languages)
			.map(language => languages[language])
			.forEach(language => {
			alertData.socket[language] = '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message[language] + ' (' + instrumentPrice + ')' + '<br>' + date;
		})
	}
}

// Multilingual notification title, shoould go to the server
const setNotificationTitle = (data) => {
	data.title = {
		[languages.EN]: '',
		[languages.PL]: '',
		[languages.AR]: '',
		[languages.ZH_HANS]: ''
	}
	
	if(data[parametersList.TEST_ENABLED]) {
		data.title[languages.EN] = 'Testing Market Notification';
		data.title[languages.PL] = 'Testing Notyfikacja z Rynku';
		data.title[languages.AR] = 'testing إخطارات السوق';
		data.title[languages.ZH_HANS] = 'Testing 市场价格提醒';
	}else{
		data.title[languages.EN] = 'Market Notification';
		data.title[languages.PL] = 'Notyfikacja z Rynku';
		data.title[languages.AR] = 'إخطارات السوق';
		data.title[languages.ZH_HANS] = '市场价格提醒';
	}
};


// Translate recieved data to a format used on client side
module.exports = function(requestData) {

	// Default no error
	var alertData = {};
	    
    var eventNumber = parseInt(requestData[parametersList.EVENT_TYPE_ID], 10);
	
	if (typeof eventList[eventNumber] === 'undefined') {
		var error = new Error();
		error.status = 500;
		error.message = 'Requested data is not valid, invalid event type number';
		return {
			error: error
		}
	}

	alertData[parametersList.TYPE] = eventList[eventNumber][parametersList.TYPE];

    alertData[parametersList.INSTRUMENT] = setInstrument(requestData);

    alertData[parametersList.ACTION] = setNotificationAction(requestData);

    alertData[parametersList.PRICE] = requestData[parametersList.NEW_VALUE];

    alertData[parametersList.CODE] = requestData[parametersList.EVENT_TYPE_ID];

    alertData[parametersList.EVENTID]  = requestData[parametersList.EVENT_ID];
    
    alertData[parametersList.TEST_ENABLED]  = requestData[parametersList.TEST_ENABLED] ? true : false;

    setPushMessage(requestData, alertData);

    setNotificationTitle(alertData);

    setSocketMessages(requestData, alertData);

    alertData[parametersList.TRIGGER_RECIEVED_TIME] = new Date();
    
    alertData[parametersList.TRIGGER_TYPE] = parametersList.MARKET_ALERT;
    
    alertData[parametersList.TRIGGER_ID] = uidGenerator();;

   	return alertData;
};

