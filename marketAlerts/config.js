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

const parametersList = {
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
	INSTRUMENT: 'instrument',
	TEST_ENABLED: 'testEnabled',
	TYPE: 'type',
	ACTION: 'action',
	PRICE: 'price',
	CODE: 'code',
	EVENTID: 'eventID',
	TRIGGER_ID: 'triggerID',
	TRIGGER_RECIEVED_TIME: 'triggerRecievedTime',
	TRIGGER_TYPE: 'triggerType',
	MARKET_ALERT: 'marketAlert'
}

const languages = {
	'EN': 'en',
	'PL': 'pl',
	'AR': 'ar',
	'ZH-HANS': 'zh-hans'
}

module.exports = {
	eventList,
	parametersList
}