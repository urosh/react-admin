"use strict";
const config = require('../config');
const parametersList = config.parametersList;

module.exports = function(directMessaging, usersManagement){
	
	// Mobile App Api methods
	directMessaging.addEvent(
		'/admin/auth/status',
		config.eventChannels.ROUTES,
		[
			
		],
		function(req, res) {
			if(req.session && req.session.username){
				res.send({
					'access': 'allowed',
					'username': req.session.username
				});
			}else{
				res.send({
					'access': 'forbiden'
				});
			}
		},
		'get'
		
	)

	directMessaging.addEvent(
		'adminLogin',
		config.eventChannels.ROUTES,
		[
			'username',
			'password'
		],
		function(req, res) {
			req.session.username = 'uros';
			res.send('Welcome');
		},
		'post',
		'/admin/auth/login',
		false
	)

	directMessaging.addEvent(
		'/api/fetch/languages',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			res.send(config.languages);
		},
		'get'
	)
	directMessaging.addEvent(
		'/admin/auth/logout',
		config.eventChannels.ROUTES,
		[],
		function(req, res) {
			req.session.destroy(function(err) {
  				res.send('logout');
			})
		},
		'get'
	)






	return {};
}