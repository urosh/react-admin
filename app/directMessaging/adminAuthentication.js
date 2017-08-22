"use strict";
const parameters = require('../parameters');
const ActiveDirectory = require('activedirectory');

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
		function(req, res, data) {
			const username = data.username;
			const password = data.password;
			
			var adConfig = { 
				url: 'ldap://prime.cy.ef.ww',
               	baseDN: 'dc=cy,dc=ef,dc=ww',
               	username: username,
               	password: password 
            }
			
			var ad = new ActiveDirectory(adConfig);
			
			ad.authenticate(username, password, function(err, auth) {
				if (err) {
					console.log(err);
			    	res.status(401);
		  			res.send('Username and password are not recognized.');
			    	return;
			  	}
			  
			  	if (auth) {
			  		req.session.username = username;
					res.send('Welcome');
			  	}

			  	else {
			  		console.log('Authentication failed!');
			  		res.status(401);
		  			res.send('Username and password are not recognized.');
			  	}
			});


			//req.session[parameters.admin.USERNAME] = 'uros';
			//res.send('Welcome');
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