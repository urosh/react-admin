"use strict";

const Settings = require('../models/settings');
const facter = require('facter');


let serverID = require('./uidGenerator')();

/*
 * Module for generating serverID. It is initialized on server startup
 * and is neccessery for normal server functioning. It is used to \
 * uniqely identify each server instance, and persist the indentification in the
 * database, 
 *
 * First the module looks for serverID stored in the settings collection in the database. If the value is 
 * found it returns it and exits. If there is no stored value, the module tries to generate one using
 * facter. On prp and production facter should be available, on a local machine its not. If no facter is found
 * we generate id using random uid generator and save it to the database. 
 *
 */
 module.exports = () => {
	// First we check the database, settings collection.
	return Settings.find()
		.exec()
		.then(settings => {
			
			// Check the database for existing id
			if(settings[0] && settings[0].serverID !== '') {
				serverID = settings[0].serverID;
				return Object.freeze(settings[0]);
			} else{
				// We dont have server id in the database, so we need to generate one
				return new Promise((resolve, reject) => {
					// First we try and use facter
					facter.query("fqdn", function(err, facts) {
				    	if(!err) {
					    	// If facter is fine setup serveID using doman name of the current server
					    	serverID = facts.fqdn;
				    	}
				    	// If facter fails, use the random id generated on server startup 
				    	var serverSettings = new Settings({
				    		serverID: serverID
				    	});
						
				    	// Save the id to the database
				    	serverSettings.save();
						resolve(Object.freeze(serverSettings));
				    });
				})
			}
		})
		.catch(err => {
			console.log(err);
			console.log(('Database Error').red + ' There was an error while retrieving server settings.');	
		})
}