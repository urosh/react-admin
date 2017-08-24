/*
 * Browser socket connections handlers
 */
"use strict";
const parameters = require('../parameters');
const _ = require('lodash');

module.exports = (clients, usersManagement) => {
	const browserConnectionsHandlers = require('./browserConnectionsHandlers')(clients, usersManagement);

	/*
	 * Browser connect event. 
	 * 
	 * Triggered whenever socket connection is established
	 * It updates user's registration with socketId and with 
	 * various user data retreived from the client on page load. Usualy connect
	 * event is initiated just after the page is loaded, which means the information
	 * passed to the server is the most up to date information related to the given 
	 * user. 
	 */
	clients.addSocketInEvent('connectBrowser', 
		[
			parameters.messageChannels.MACHINE_HASH,
			parameters.user.USER_ID,
			parameters.user.TEST_ENABLED,
			parameters.user.MARKET_ALERT_ALLOW,
			parameters.user.LANGUAGE,
			parameters.user.PAIRS,
			parameters.messageChannels.SOCKET_ID
		], 
		browserConnectionsHandlers.connectBrowser
	);


	// Closing socket connection
	clients.addSocketInEvent(
		'disconnect', 
		[
			parameters.messageChannels.SOCKET_ID
		], 
		browserConnectionsHandlers.disconnect
	);


	/*
	 * Tab visibility change handler. 
	 * Event that manages user's connections as they navigate from and back to the page. When 
	 * the user is active on the EM platform socket based alert should be displayed. If the user is 
	 * not on the platform we should show push notification.
	 *
	 */
	clients.addSocketInEvent(
		'tabVisibilityChange',
		[
			parameters.user.USER_ID,
			parameters.messageChannels.MACHINE_HASH,
			parameters.messageChannels.TAB_ACTIVE,
		],
		browserConnectionsHandlers.tabVisibilityChange
	)

	/*
	 * Updating Market Alert's subscription
	 */
	clients.addSocketInEvent(
		'updateMarketAlertsSubscription',
		[
			parameters.user.USER_ID,
			parameters.user.MARKET_ALERT_ALLOW
		],
		browserConnectionsHandlers.updateMarketAlertsSubscription
	)
	
	/*
	 * Instrument update handler. Initiated when user selects/unselects favorite instrument
	 * in the tradezone. 
	 */
	clients.addSocketInEvent(
		'instrumentUpdate',
		[
			parameters.user.USER_ID,
			parameters.user.INSTRUMENT,
			parameters.user.INSTRUMENT_STATUS
		],
		browserConnectionsHandlers.instrumentUpdate
	)
	
	/*
	 * Helper event that measures socket latency and sends this information to the tracking
	 * module. 
	 */
	clients.addSocketInEvent(
		'setMachineInfo',
		[
			[parameters.messageChannels.MACHINE_HASH], 
			[parameters.tracking.USER_AGENT], 
			[parameters.tracking.IP], 
			[parameters.tracking.COUNTRY], 
			[parameters.tracking.LATITUDE], 
			[parameters.tracking.LONGITUDE], 
			[parameters.tracking.REGION]
		],
		browserConnectionsHandlers.setMachineInfo
	)
}

