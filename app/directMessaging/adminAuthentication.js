"use strict";
const parameters = require('../parameters');

module.exports = (directMessaging) => {
	//console.log(directMessaging.getEventsTest().events);
	// Mobile App Api methods
	directMessaging.addHttpInEvent(
		'/admin/auth/status',
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
		'get'
		
	)

	directMessaging.addHttpInEvent(
		'adminLogin',
		[
			[parameters.admin.USERNAME],
			[parameters.admin.PASSWORD]
		],
		function(req, res) {
			req.session[parameters.admin.USERNAME] = 'uros';
			res.send('Welcome');
		},
		'post',
		'/admin/auth/login'
	)
	
	directMessaging.addHttpInEvent(
		'/admin/auth/logout',
		[],
		function(req, res) {
			req.session.destroy(function(err) {
  				res.send('logout');
			})
		},
		'get'
	)


}