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
 * http://lcl.easymarkets.com/live/market-trigger/?data={%22instrument%22:%22oil-usd%22,%22type%22:%22blah%22,%22random%22:24,%20%22price%22:1000}
 */
const constants = require('../config');
const eventList = constants.eventList;
const parametersList = constants.parametersList;
const uidGenerator = require('../../utils/uidGenerator');
const languages = constants.languages;

const roundToTwo = value => (Math.round(value * 100) / 100);

const setInstrument = data => data[parametersList.BASE_CURR] + '/' + data[parametersList.NON_BASE_CURR];

// Instrument based url
const setNotificationUrl = data =>  '/trade/' + data[parametersList.BASE_CURR].toLowerCase() + '-' + data[parametersList.NON_BASE_CURR].toLowerCase() + '/';


const setEventDate = data =>  (data[parametersList.EVENT_DATE]
						.split(' ')
						.map(function(item){
							if(item.indexOf('-') > -1){
								return item.split('-').reverse().join('/');
							}
							return item;
						}).join(' '))

// Formating notification message based on recieved data
const setPushMessage = (data, alertData) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = alertData[parametersList.INSTRUMENT];

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	alertData.push = {
		[languages.EN]: '',
		[languages.PL]: '',
		[languages.AR]: '',
		[languages.ZH-HANS]: ''
	}
	const date = setEventDate(data) + ' GMT';

	if(eventNumber === 1 || eventNumber === 2) {
		
		let diff = data[parametersList.DIFFERENCE];
		if(data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE]) { 
			diff = '+' + diff 
		}else{
			diff = '-' + diff 
		}
		diff = diff + '%';
		
		const message = instrument.toUpperCase() + ' at ' + instrumentPrice +  ' (' + diff + ') ' + '\n\n' + date;
		alertData.push[languages.EN] = message
		alertData.push[languages.PL] = message;
		alertData.push[languages.AR] = message;
		alertData.push[languages.ZH-HANS] = message;

	}else{
		
		alertData.push[languages.EN] =  instrument.toUpperCase() + ' ' + eventList[eventNumber].message[languages.EN] + ' (' + instrumentPrice + ')' + '\n' + date;
		alertData.push[languages.PL] =  instrument.toUpperCase() + ' ' + eventList[eventNumber].message[languages.PL] + ' (' + instrumentPrice + ')' + '\n' + date;
		alertData.push[languages.AR] =  instrument.toUpperCase()+ ' ' + eventList[eventNumber].message[languages.AR] + ' (' + instrumentPrice + ')' + '\n' + date;
		alertData.push[languages.ZH-HANS] =  instrument.toUpperCase() + ' ' + eventList[eventNumber].message[languages.ZH-HANS] + ' (' + instrumentPrice + ')' + '\n' + date;
	}

}

const setSocketMessages = (data, alertData) => {
	const eventNumber = parseInt(data[parametersList.EVENT_TYPE_ID], 10);
	const instrument = alertData[parametersList.INSTRUMENT];

	const instrumentPrice = Math.round(data[parametersList.NEW_VALUE] * 10000) / 10000;
	
	const date = '<span class="eventDate">' +  setEventDate(data) + ' GMT</span>';

	alertData.socket = {
		'en': '',
		'pl': '',
		'ar': '',
		'zh-hans': ''
	}

	let message;
	
	if (eventNumber === 1 || eventNumber === 2){
		
		var diff = data[parametersList.DIFFERENCE];
		
		if(data[parametersList.NEW_VALUE] > data[parametersList.OLD_VALUE]) { 
			diff = '+' + diff 
		}else{
			diff = '-' + diff 
		}

		diff = diff + '%';

		message = '<span dir="ltr"><strong>' + instrument.toUpperCase() + ' at ' + instrumentPrice + '</strong> ' + ' (' + diff + ')</span> ';
		
		message = message + '<br>' + date;
		alertData.socket['en'] = message;
		alertData.socket['pl'] = message;
		alertData.socket['ar'] = message;
		alertData.socket['zh-hans'] = message;
	}else{
		
		alertData.socket['en'] =  '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message['en'] + ' (' + instrumentPrice + ')' + '<br>' + date;
		alertData.socket['pl'] =  '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message['pl'] + ' (' + instrumentPrice + ')' + '<br>' + date;
		alertData.socket['ar'] =  '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message['ar'] + ' (' + instrumentPrice + ')' + '<br>' + date;
		alertData.socket['zh-hans'] =  '<strong>' + instrument.toUpperCase() + '</strong> ' + eventList[eventNumber].message['zh-hans'] + ' (' + instrumentPrice + ')' + '<br>' + date;
	}
}

// Multilingual notification title, shoould go to the server
const setNotificationTitle = (data) => {
	data.title = {
		'en': '',
		'pl': '',
		'ar': '',
		'zh-hans': ''
	}
	
	if(data[parametersList.TEST_ENABLED]) {
		data.title['en'] = 'Testing Market Notification';
		data.title['pl'] = 'Testing Notyfikacja z Rynku';
		data.title['ar'] = 'testing إخطارات السوق';
		data.title['zh-hans'] = 'Testing 市场价格提醒';
	}else{
		data.title['en'] = 'Market Notification';
		data.title['pl'] = 'Notyfikacja z Rynku';
		data.title['ar'] = 'إخطارات السوق';
		data.title['zh-hans'] = '市场价格提醒';
	}
};



// Checking inputs
const checkRecievedData = (properties, data) => {
	return properties.reduce((current, next) => {
			if(current === ''){
			    if (next in data) return '';
			    return next;
			}
			return current;
		}, '') ;
}

// Translate recieved data to a format used on client side
// This module should make sure that our data is correct.
module.exports = function(requestData) {

	// Default no error
	var alertData = {
		instrument: '',
		type: '',
		action: ''
	};

	    
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

    alertData[parametersList.ACTION] = setNotificationUrl(requestData);

    alertData[parametersList.PRICE] = requestData[parametersList.NEW_VALUE];

    alertData[parametersList.CODE] = requestData[parametersList.EVENT_TYPE_ID];

    alertData[parametersList.EVENTID]  = requestData[parametersList.EVENT_ID];
    
    alertData[parametersList.TEST_ENABLED]  = requestData['testing'] ? true : false;

    setPushMessage(requestData, alertData);

    setNotificationTitle(alertData);

    setSocketMessages(requestData, alertData);

    alertData[parametersList.TRIGGER_RECIEVED_TIME] = new Date();
    
    alertData[parametersList.TRIGGER_TYPE] = parametersList.MARKET_ALERT;
    
    alertData[parametersList.TRIGGER_ID] = uidGenerator();;



   	return alertData;
	
	
};

