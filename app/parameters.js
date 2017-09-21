/*
 * List of parameters used by different modules in the app. Not
 * sure if this is the best solutions to keep them like this
 * in the object. But at least it prevents errors when misstyping property names
 */

const general = {
	TEST: 'test',
	METHOD: 'method',
	URL: 'url',
	DATA: 'data',
	SCREEN: 'screen'
}

const user = {
	USER_ID: 'userID',
	USER_LOGGED_IN: 'userLoggedIn',
	TEST_ENABLED: 'testEnabled',
	MARKET_ALERT_ALLOW: 'marketAlertAllow',
	DIRECT_MESSAGE_ALLOW: 'directMessageAllow',
	LANGUAGE: 'language',
	CULTURE: 'culture',
	PAIRS: 'pairs',
	MOBILE_PAIRS: 'mobilePairs',
	INSTRUMENT: 'instrument',
	INSTRUMENT_STATUS: 'instrumentStatus',
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
};

const messageChannels = {
	PUSH: 'push',
	SOCKETS: 'socket',
	ALERT: 'alert',
	BROWSERS: 'browser',
	MOBILES: 'mobile',
	HTTP : 'http',
	REDIS: 'redis',
	POST: 'post',
	GET: 'get',
	SOCKET_ID: 'socketID',
	SOCKET_ACTIVE: 'socketActive',
	TAB_ACTIVE: 'tabActive',
	PUSH_ENABLED: 'pushEnabled',
	PUSH_ACTIVE: 'pushActive',
	NOTIFICATION_DELIVERY_METHOD: 'notificationDeliveryMethod',
	TOKEN: 'token',
	OLD_TOKEN: 'oldToken',
	NEW_TOKEN: 'newToken',
	MACHINE_HASH: 'machineHash',
	DEVICE_ID: 'deviceID',
	SYSTEM: 'system',
	SOUND: 'sound',
	FIRST_CONNECTION_DATE: 'fisrtConnectionDate',
	LAST_CONNECTION_DATE: 'lastConnectionDate',
	APP_VERSION_NUMBER: 'appVersionNumber'

}

const marketAlerts = {
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
	TITLE: 'title',
	DETAIL: 'detail',
	BODY: 'body',
	MESSAGE: 'message',
	SOCKET_MESSAGE: 'socketMessage',
	PUSH_URL: 'pushUrl',
	MESSAGE_TYPE: 'messageType'

};

const admin = {
	USERNAME: 'username',
	FILTERS: 'filters',
	PASSWORD: 'password',
	ACCESS: 'access',
	ADMIN: 'admin',
	RECIPIENT_STATS: 'recipientStats'
};
const directMessaging = {
	TITLE: 'title',
	DETAIL: 'detail',
	BODY: 'body',
	MESSAGE: 'message',
	DATA: 'data'
};

const tracking = {
	TRIGGER_ID: 'triggerID',
	NOTIFICATION_ID: 'notificationID',
	TRIGGER_RECIEVED_TIME: 'triggerRecievedTime',
	TRIGGER_TYPE: 'triggerType',
	MARKET_ALERT: 'marketAlert',
	PUSH_SERVER_URL: 'pushServerUrl',
	NOTIFICATION_RECEIVED: 'notificationReceived',
	ACTION_TIME: 'actionTime',
	PUSH_ID: 'pushID',
	USER_AGENT: 'userAgent',
	IP: 'ip',
	COUNTRY: 'country',
	LATITUDE: 'latitude',
	LONGITUDE: 'longitude',
	REGION: 'region',
	VISIBLE: 'visible',
	TIME: 'time',
	USER_ACTION: 'userAction'
}


module.exports = {
	marketAlerts,
	general,
	user,
	admin,
	directMessaging,
	messageChannels,
	tracking
}