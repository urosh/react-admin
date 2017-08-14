/*
 * Group of events providing http rest api endpoints used by mobile app. 
 */

"use strict";

const parameters = require('../parameters');
const _ = require('lodash');

module.exports  = (clients, usersManagement) => {
	
	/*
	 * Connect method, called when user opens the app, or when the user logs in.
	 * If user is loged in, it searches for the user's registration in the system
	 * and updates it with mobile app info. If no user is found the new user is created
	 * and added to the users registrations object. 
	 *
	 */
	clients.addRedisInEvent(
		'updateUser',
		[
			'id',
			'data'
		],
		function(usersData) {
			usersManagement.setUsersData(usersData.data, usersData.id);
		}
	)
	


}