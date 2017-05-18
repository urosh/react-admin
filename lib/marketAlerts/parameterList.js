"use strict";

const parameterList = {
	SERVER_ID: 'serverID',
	USER_ID: 'userID',
	MACHINE_HASH: 'machineHash',
	USER_LOGGED_IN: 'userLoggedIn',
	TEST_ENABLED: 'testEnabled',
	MARKET_ALERT_ALLOW: 'marketAlertAllow',
	PUSH_ENABLED: 'pushEnabled',
	LANGUAGE: 'language',
	CULTURE: 'culture',
	SOCKET_ID: 'socketID',
	SOCKET_ACTIVE: 'socketActive',
	PAIRS: 'pairs',
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
	WITHDRAWAL_AVAILABLE: 'withdrawalAvailable'

}

const messageChannels = {
	BROWSER: 'browser',
	PUSH: 'push',
	MOBILE: 'mobile'
}
module.exports = {
	parameterList,
	messageChannels
};