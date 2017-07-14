"use strict";
const parameters = require('../parameters');

module.exports = (directMessaging) => {

	// Mobile App Api methods
	directMessaging.addEvent(
		'/admin/auth/status',
		parameters.messageChannels.ROUTES,
		[],
		function(req, res) {
			if(req.session && req.session.username){
				res.send({
					[parameters.admin.ACCESS]: 'allowed',
					[parameters.admin.USERNAME]: req.session[parameters.admin.USERNAME]
				});
			}else{
				res.send({
					'access': 'forbiden'
				});
			}
		},
		[parameters.messageChannels.GET]
		
	)

	directMessaging.addEvent(
		'adminLogin',
		parameters.messageChannels.ROUTES,
		[
			[parameters.admin.USERNAME],
			[parameters.admin.PASSWORD]
		],
		function(req, res) {
			req.session[parameters.admin.USERNAME] = 'uros';
			res.send('Welcome');
		},
		[parameters.messageChannels.POST],
		'/admin/auth/login',
		false
	)
	
	directMessaging.addEvent(
		'/admin/auth/logout',
		parameters.messageChannels.ROUTES,
		[],
		function(req, res) {
			req.session.destroy(function(err) {
  				res.send('logout');
			})
		},
		[parameters.messageChannels.GET]
	)

}