/*
 * Group of events providing http rest api endpoints used by mobile app. 
 */

"use strict";

const parameters = require('../parameters');
const _ = require('lodash');
const fs = require('fs');


module.exports  = (clients, usersManagement) => {

const mobileConnectionsHandler = require('./mobileConnectionsHandlers')(clients, usersManagement);


	/*
	 * Connect method, called when user opens the app, or when the user logs in.
	 */
	clients.addHttpInEvent({
		name: 'mobileConnect',
		data: [
			parameters.user.USER_ID,
			parameters.user.LANGUAGE,
			parameters.user.CULTURE,
			parameters.messageChannels.TOKEN,
			parameters.messageChannels.SYSTEM,
			parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD
		],
		handler: mobileConnectionsHandler.mobileConnect,
		method: 'post',
		url: '/devices/mobile/connect',
		distributed: true
	})
	/*
	 * Transforming mongodb mobile registration to the new structure. This should be one off action
	 * that is triggered when making transition between old and new server version. In the updated 
	 * server we store data in different format. In order not to lose old registration we need a way
	 * to get data stored in the mongodb using the old format and add it to the new system
	 *
	 */
	clients.addHttpInEvent({
		name: 'transformMobileData',
		handler: mobileConnectionsHandler.transformMobileData,
		method: 'post',
		url: '/devices/mobile/transform',
		distributed: true		
	});
	
	/*
	 * Mobile logout handler
	 * 
	 * Action steps: 
	 * - Get the user of the device. 
	 * - Get the device data and update it
	 * - Update the users object
	 *
	 */
	clients.addHttpInEvent({
		name: 'mobileLogout',
		data: [
			parameters.messageChannels.TOKEN,
			parameters.user.USER_ID,
		],
		handler: mobileConnectionsHandler.mobileLogout,
		method: 'post',
		url: '/devices/mobile/logout',
		distributed: true
	});

	clients.addHttpInEvent({
		name: 'mobileTokenUpdate',
		data: [
			parameters.messageChannels.OLD_TOKEN,
			parameters.messageChannels.NEW_TOKEN,
		],
		handler: mobileConnectionsHandler.mobileTokenUpdate,
		method: 'post',
		url: '/devices/mobile/update',
		distributed: true
	})

	clients.addHttpInEvent({
		name: 'mobileDelete',
		data: [ parameters.messageChannels.TOKEN ],
		handler: mobileConnectionsHandler.mobileDelete,
		method: 'post',
		url: '/devices/mobile/delete'
	})

}