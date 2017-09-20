"use strict";
const parameters = require('../parameters');
const _ = require('lodash');
const fs = require('fs');
const languages = require('../config').languages;

const UsersModel = require('../../models/user');
const OldMobileModel = require('../../models/mobile');
const OldPushModel = require('../../models/push');



/*
 * Event handlers are exposed so that we can reuse handlers when there is a need for it and to 
 * be able to unit test each handler. 
 */
module.exports  = (clients, usersManagement) => {
	/*
	 * Mobile App Connect method, called when user opens the app, or when the user logs in.
	 * If user is loged in, it searches for the user's registration in the system
	 * and updates it with mobile app info. If no user is found the new user is created
	 * and added to the users registrations object. 
	 *
	 * Step by step actions: 
	 * - Get user id based on the data we received. If user is logged out, we will 
	 * use mobile token as id. If user is logged in we use userID
	 * - Remove previous instances of mobile registration. This goes through all the
	 * registrations searches for devices with same token or deviceID, and deletes them. 
	 * - Create or update users object by adding mobile device data
	 * - Connect mssql to get stores marketAlertAllow and mobileParis
	 * - Update mongoDB
	 * - Send data over redis to all instances to update users object
	 *
	 */
	const mobileConnect = data => {

		// Make sure userID is in correct format
		if(data[parameters.user.USER_ID] === 'null') {
			data[parameters.user.USER_ID] = null;
		}
		// Get the id value for current user. Depending on user status it might
		// be userID, token or machineHash
		let id = usersManagement.getUserId(data);
		
		// Make sure language is valid. If not set to default -> en
		let languageValid = false;

		Object.keys(languages)
			.map(lang => languages[lang])
			.map(language => {
				if(language === data[parameters.user.LANGUAGE]){
					languageValid = true;
				}
			})
		if(!languageValid){
			data[parameters.user.LANGUAGE] = 'en';
		}
		// Get user object template	
		const userModel = usersManagement.getUserModel();
		
		const sql = usersManagement.getSqlConnection();
		
		// Remove all references to the current mobile device
		let mobileConnectionDates = usersManagement.removeMobileFromUsers(data[parameters.messageChannels.TOKEN], data[parameters.messageChannels.DEVICE_ID]);
		
		/*
		 * Build updated user data, from potential existin users object, user 
		 * template and receivied data
		 */
		let user = Object.assign({}, userModel, usersManagement.getUser(id));

		if(!user) return;
		
		// In case the user registration is new, we need to set userId
		user[parameters.messageChannels.TOKEN] = data[parameters.messageChannels.TOKEN];
		user[parameters.user.USER_ID] = data[parameters.user.USER_ID];
		
		data[parameters.messageChannels.FIRST_CONNECTION_DATE] = mobileConnectionDates || new Date();
		data[parameters.messageChannels.LAST_CONNECTION_DATE] = new Date();
		
		if(!data[parameters.messageChannels.APP_VERSION_NUMBER]){
			data[parameters.messageChannels.APP_VERSION_NUMBER] = null;
		}

		let mobileRegistrations = user[parameters.messageChannels.MOBILES];
		
		mobileRegistrations.push(data);
		
		usersManagement.updateUserDatabaseRecord(user);

		usersManagement.setUsersData(user, id);

		if(user[parameters.user.USER_ID]){
			usersManagement.getUsersDataFromMssql(user[parameters.user.USER_ID])
				.then((response) => {
					user = usersManagement.getUser(id)
					
					user[parameters.user.MARKET_ALERT_ALLOW] = response[parameters.user.MARKET_ALERT_ALLOW];
					
					user[parameters.user.MOBILE_PAIRS] = response[parameters.user.MOBILE_PAIRS];
					
					usersManagement.updateUserDatabaseRecord(user);
				
					usersManagement.setUsersData(user, id);

				})
		}
	}
	
	const transformMobileData = data => {
		console.log('Mobile Management: Initializing MongoDB mobile data transformation');
		
		OldMobileModel
			.find()
			.exec()
			.then(savedUsers => {
				savedUsers.forEach((savedUser, i) => {
					
					let userData = {};
					
					userData[parameters.user.USER_ID] = savedUser[parameters.user.USER_ID];
					userData[parameters.user.CULTURE] = savedUser[parameters.user.CULTURE];
					userData[parameters.user.LANGUAGE] = savedUser[parameters.user.LANGUAGE];
					userData[parameters.messageChannels.TOKEN] = savedUser[parameters.messageChannels.TOKEN];
					userData[parameters.messageChannels.SYSTEM] = savedUser[parameters.messageChannels.SYSTEM];
					userData[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD] = savedUser[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD];
					userData[parameters.messageChannels.DEVICE_ID] = savedUser[parameters.messageChannels.DEVICE_ID];
					userData[parameters.messageChannels.APP_VERSION_NUMBER] =  userData[parameters.messageChannels.APP_VERSION_NUMBER] ? userData[parameters.messageChannels.APP_VERSION_NUMBER] : null;
					mobileConnect(userData);			
					
				})
			})
	}
	/*
	 * Mobile logout handler
	 * 
	 * Action steps: 
	 * - Get the user of the device. 
	 * - Get the device data and update it
	 * - Update the users object
	 *
	 */
	const mobileLogout = data => {
		
		console.log(`Mobile Management: Mobile app [userID: ${data[parameters.user.USER_ID]}] logout`)
		
		let mobileData;
		
		// Get user
		let user = usersManagement.getUser(data[parameters.user.USER_ID]);
		if(_.isEmpty(user)) return;
		
		// Get mobile object
		let mobileObject = usersManagement.getMobileObject(user, data[parameters.messageChannels.TOKEN]);
		
		if(_.isEmpty(mobileObject)) return;
		// Update userId
		mobileObject[parameters.user.USER_ID] = null;
			
		usersManagement.updateUserDatabaseRecord(user);
		
		usersManagement.setUsersData(user, user[parameters.user.USER_ID]);

	}

	const mobileTokenUpdate = data => {
		
		console.log(`Mobile Management: Updating mobile app token [old token, new token][${data[parameters.messageChannels.OLD_TOKEN]}, ${data[parameters.messageChannels.OLD_TOKEN]}]`);

		// Grap new/old token references
		const oldToken = data[parameters.messageChannels.OLD_TOKEN];
		const newToken = data[parameters.messageChannels.NEW_TOKEN];
		
		// Get old user mobile registration
		let oldUser = usersManagement.getMobileUser(oldToken);
		
		if(_.isEmpty(oldUser)) return;
		// Depending if the user is logged in get the id
		let oldId = oldUser[parameters.user.USER_ID] ? oldUser[parameters.user.USER_ID] : oldToken;
		let newId = oldUser[parameters.user.USER_ID] ? oldUser[parameters.user.USER_ID] : newToken;

		usersManagement.setUsersData({}, oldId);
		
		let newUser = _.cloneDeep(oldUser);
		
		let mobileObject = usersManagement.getMobileObject(newUser, oldToken);
		
		if(mobileObject) {
			mobileObject[parameters.messageChannels.TOKEN] = newToken;
		} 
		
		usersManagement.setUsersData(newUser, newId);
		

	}
	
	const mobileDelete = data => {
		
		console.log(`Mobile Management: Deleting mobile app registration for token [${data[parameters.messageChannels.TOKEN]}]`);

		// Mobile registration function
		const token = data[parameters.messageChannels.TOKEN];
		let user = usersManagement.getMobileUser(token);
		
		if(_.isEmpty(user)) return;

		user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] !== token);
		
		usersManagement.setUsersData(user, usersManagement.getUserId(user));

	}


	return{
		mobileConnect,
		transformMobileData,
		mobileLogout,
		mobileTokenUpdate,
		mobileDelete
	}
}
