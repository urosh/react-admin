const loadDataFromDatabase = process.env.LOAD_DATA_FROM_DATABASE === '1' ? true : false;

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
			"es": "cotizando al nivel más bajo de los últimos 30 días",
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
			"es": "cotizando al nivel más alto de los últimos 30 días",
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
			"es":"cotizando al nivel más bajo de los últimos 90 días",
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
			"es": "cotizando al nivel más alto de los últimos 90 días",
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
			"es":"cotizando al nivel más bajo del año",
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
			"es": "cotizando al nivel más alto del año",
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
	
};

const mssqlHost = 'mssql://' + process.env.MSSQL_USER + ':' + process.env.MSSQL_PASS + '@' + process.env.MSSQL_IP + ':' + process.env.MSSQL_PORT + '/EZFX_MC';

const mssql = {
	host: mssqlHost
};



const languages = {
	'EN': 'en',
	'PL': 'pl',
	'AR': 'ar',
	'ZH_HANS': 'zh-hans',
	'ES': 'es'
}


/*const messageChannels = {
	BROWSER: 'browser',
	PUSH: 'push',
	MOBILE: 'mobile'
}*/

const webeyezRedisHost = process.env.WEBEYEZ_REDIS_IP;
const webeyezRedisPort = process.env.WEBEYEZ_REDIS_PORT;

//const ADMIN_FCM_SERVER_KEY = 'AIzaSyAP8CDwT4ANSrCZvcaZMRHw1_Dt4dH1wBA';
//const CLIENT_FCM_SERVER_KEY = 'AIzaSyBuBkx25PYli0uCjdzhp20p9M6CqMibKyc';

const pushyApiKey = process.env.PUSHY_API_KEY;
const adminFcmServerKey = process.env.ADMIN_FCM_SERVER_KEY;
const clientFcmServerKey = process.env.CLIENT_FCM_SERVER_KEY;

module.exports = {
	globalPairs,
	db,
	mssql,
	mssqlHost,
	sentinels,
	socketOrigins,
	eventList,
	languages,
	webeyezRedisHost,
	webeyezRedisPort,
	adminFcmServerKey,
	clientFcmServerKey,
	loadDataFromDatabase,
	pushyApiKey
}