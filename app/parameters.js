
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
	MESSAGE: 'message',
	SOCKET_MESSAGE: 'socketMessage',
	PUSH_URL: 'pushUrl',
	MESSAGE_TYPE: 'messageType'

};

const general = {
	SERVER_ID: 'serverID',
	PROCESSING_SERVER_ID: 'processingServerID',
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
	LANGUAGE: 'language',
	CULTURE: 'culture',
	PAIRS: 'pairs',
	
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
const admin = {
	USERNAME: 'username',
	FILTERS: 'filters',
	PASSWORD: 'password',
	ACCESS: 'access',
	ADMIN: 'admin',
	RECIPIENT_STATS: 'recipientStats'
};
const directMessaging = {};
const messageChannels = {
	PUSH: 'push',
	SOCKETS: 'socket',
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
	SYSTEM: 'system',

}

const tracking = {
	TRIGGER_ID: 'triggerID',
	NOTIFICATION_ID: 'notificationID',
	TRIGGER_RECIEVED_TIME: 'triggerRecievedTime',
	TRIGGER_TYPE: 'triggerType',
	MARKET_ALERT: 'marketAlert',
	PUSH_SERVER_URL: 'pushServerUrl',
	NOTIFICATION_RECEIVED: 'notificationReceived',
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