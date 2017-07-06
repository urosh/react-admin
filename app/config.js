
const globalPairs = [
	'EUR/USD',
	'USD/CHF', 
	'USD/JPY',
	'GBP/USD',
	'XAU/USD',
	'AUD/USD', 
	'XAG/USD', 
	'OIL/USD',
	'BRT/USD',
	'DAX/EUR',
	'FTS/GBP',
	'NDQ/USD',
	'DOW/USD',
	'USD/CAD',
	'EUR/JPY',
	'GBP/JPY',
	'NZD/USD',
	'EUR/GBP',
	'AUD/JPY',
	'USX/USD',
	'CAC/EUR',
	'NKI/USD',
	'USD/CNH',
	'NZD/JPY',
	'ASX/AUD'
];

// Event Types
const eventList = {
	"1" : {
		"name": "1 Hour Min Low Changed", 
		"type": "low", 
		"message": {
			"en": "Hits 1 Month Low"
		} 
	},
	"2" : {
		"name": "1 Hour Max High Changed", 
		"type": "high", 
		"message": {
			"en": "Hits 1 Month Low"
		}
	},
	"3" : {
		"name": "30 Days Min Low Changed", 
		"type": "low", 
		"message": {
			"en": "trading at a 30 day low",
			"pl": "kurs na 30 dniowym spadku",
			"ar": "يتداول عند أدنى مستوى لمدة 30 يوما",
			"zh-hans": "跌至30日低位"
		}
	},
	"4" : {
		"name": "30 Days Max High Changed", 
		"type": "high", 
		"message": {
			"en": "trading at a 30 day high",
			"pl": "kurs na 30 dniowym wzroście",
			"ar": "يتداول عند أعلى مستوى لمدة 30 يوما",
			"zh-hans": "升至30日高位"
		}
	},
	"5" : {
		"name": "90 Days Min Low Changed", 
		"type": "low", 
		"message": {
			"en":"trading at a 90 day low",
			"pl":"kurs na 90 dniowym spadku",
			"ar":" يتداول عند أدنى مستوى لمدة 90 يوما",
			"zh-hans":"跌至90日低位"
		}
	},
	"6" : {
		"name": "90 Days Max High Changed", 
		"type": "high", 
		"message": {
			"en": "trading at a 90 day high",
			"pl": "kurs na 90 dniowym wzroście",
			"ar": "يتداول عند أعلى مستوى لمدة 90 يوما",
			"zh-hans": "升至90日高位"
		}
	},
	"7" : {
		"name": "1 Year Min Low Changed", 
		"type": "low", 
		"message": {
			"en":"trading at a 1 year low",
			"pl":"kurs na rocznym spadku",
			"ar":"يتداول عند أدنى مستوى لمدة سنة",
			"zh-hans":"跌至1年来低位"
		}
	},
	"8" : {
		"name": "1 Year Max High Changed", 
		"type": "high", 
		"message": {
			"en": "trading at a 1 year high",
			"pl": "kurs na rocznym wzroście",
			"ar": "يتداول عند أعلى مستوى لمدة سنة",
			"zh-hans": "升至1年来高位"
		}
	}
}

const db = {
	name: 'marketNotifications',
	connection: 'mongodb://localhost:27017/'
};


const sentinels = [
	{ host: 'localhost', port: 26379 }
];


const socketOrigins = 'www.easymarkets.com:* chn.easymarkets.com:* prp.easymarkets.com:* prpchn.easymarkets.com:* lcl.easymarkets.com:* pushprp.easymarkets.com:* notify.easymarkets.com:*';

const eventChannels = {
	SOCKETS : 'sockets',
	ROUTES : 'routes',
	REDIS: 'redis',
	POST: 'post',
	GET: 'get'
};

const mssqlHost = 'mssql://' + process.env.MSSQL_USER + ':' + process.env.MSSQL_PASS + '@' + process.env.MSSQL_IP + ':' + process.env.MSSQL_PORT + '/EZFX_MC';

const mssql = {
	host: mssqlHost
};


const parametersList = {
	SERVER_ID: 'serverID',
	PROCESSING_SERVER_ID: 'processingServerID',
	USER_ID: 'userID',
	MACHINE_HASH: 'machineHash',
	USER_LOGGED_IN: 'userLoggedIn',
	TEST_ENABLED: 'testEnabled',
	TEST: 'test',
	MARKET_ALERT_ALLOW: 'marketAlertAllow',
	LANGUAGE: 'language',
	CULTURE: 'culture',
	PAIRS: 'pairs',
	TOKEN: 'token',
	OLD_TOKEN: 'oldToken',
	NEW_TOKEN: 'newToken',
	SYSTEM: 'system',
	SOCKET_ID: 'socketID',
	SOCKET_ACTIVE: 'socketActive',
	TAB_ACTIVE: 'tabActive',
	INSTRUMENT: 'instrument',
	INSTRUMENT_STATUS: 'instrumentStatus',
	PUSH_ENABLED: 'pushEnabled',
	PUSH_ACTIVE: 'pushActive',
	NOTIFICATION_DELIVERY_METHOD: 'notificationDeliveryMethod',
	ACCOUNT_BASE_CURRENCY: 'accountBaseCurrency',
	ALLOW_DEPOSIT: 'allowDeposit',
	ALLOW_WITHDRAWAL: 'allowWithdrawal',
	ALLOWED_CANCELLATION: 'allowedCancellation',
	COUNTRY_NAME: 'countryName',
	COUNTRY_ID: 'countryID',
	DEFAULT_PORTAL: 'defaultPortal',
	DEMO_EXPIRATION_DAYS: 'demoExpirationDays',
	HAS_CREDIT_CARD: 'hasCreditCard',
	HAS_MT4_ACCOUNT: 'hasMts4Account',
	IS_ACTIVE: 'isActive',
	IS_ACCOUNT_CLOSED: 'isAccountClosed',
	WITHDRAWAL_AVAILABLE: 'withdrawalAvailable',
	PUSH: 'push',
	SOCKETS: 'socket',
	BROWSERS: 'browser',
	MOBILES: 'mobile',
	METHOD: 'method',
	URL: 'url',
	DATA: 'data',
	ROW_ID: 'row_id',
	EVENT_ID: 'event_id',
	EVENT_DATE: 'event_date',
	BASE_CURR: 'base_curr',
	NON_BASE_CURR: 'non_base_curr',
	EVENT_TYPE_ID: 'event_type_id',
	NEW_VALUE: 'new_value',
	OLD_VALUE: 'old_value',
	LAST_EVENT_DATE: 'last_event_date',
	DIFFERENCE: 'difference',
	EVENT_DESCRIPTION: 'event_description',
	TYPE: 'type',
	ACTION: 'action',
	PRICE: 'price',
	CODE: 'code',
	EVENTID: 'eventID',
	TRIGGER_ID: 'triggerID',
	TRIGGER_RECIEVED_TIME: 'triggerRecievedTime',
	TRIGGER_TYPE: 'triggerType',
	MARKET_ALERT: 'marketAlert',
	PUSH_SERVER_URL: 'pushServerUrl',
	NOTIFICATION_RECEIVED: 'notificationReceived',
	PUSH_ID: 'pushID'

}


const languages = {
	'EN': 'en',
	'PL': 'pl',
	'AR': 'ar',
	'ZH_HANS': 'zh-hans'
}


const messageChannels = {
	BROWSER: 'browser',
	PUSH: 'push',
	MOBILE: 'mobile'
}

const webeyezRedisHost = process.env.WEBEYEZ_REDIS_IP;
const webeyezRedisPort = process.env.WEBEYEZ_REDIS_PORT;

module.exports = {
	globalPairs,
	db,
	mssql,
	mssqlHost,
	sentinels,
	socketOrigins,
	eventChannels,
	parametersList,
	messageChannels,
	eventList,
	languages,
	webeyezRedisHost,
	webeyezRedisPort
}