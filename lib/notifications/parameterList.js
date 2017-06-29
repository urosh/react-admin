"use strict";

const parametersList = {
	SERVER_ID: 'serverID',
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
	DATA: 'data'

}

const messageChannels = {
	BROWSER: 'browser',
	PUSH: 'push',
	MOBILE: 'mobile'
}
module.exports = {
	parametersList,
	messageChannels
};