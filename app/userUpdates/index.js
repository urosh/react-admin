"use strict";
const parameters = require('../parameters');

module.exports = function(webeyezRedis, usersManagement){
	
	webeyezRedis.addRedisInEvent({
		name: 'UserSettingsChanged', 
		handler: function(data) {
			
			let userData = JSON.parse(data.Message);
                
            if(!data.UserId || typeof userData.GetMarketAlerts === undefined) return;
                
            let userID = data.UserId.toString();
            let marketAlertAllow = userData.GetMarketAlerts;
			let notifyOnInstruments = userData.NotifyOnInstruments;
				
			console.log(`Mobile Registration user ${userID} update using webeyez Redis: [marketAlertAllow, notifyOnInstruments]`, marketAlertAllow, notifyOnInstruments);
                
            mobileManagement.updateUserRegistration(userID, marketAlertAllow, notifyOnInstruments);
            let user = usersData.getUser(userID);
            if(typeof marketAlertAllow !== 'undefined') {
	            user[parameters.user.MARKET_ALERT_ALLOW] = marketAlertAllow;
            }

            if(typeof notifyOnInstruments !== 'undefined') {
	            user[parameters.user.MOBILE_PAIRS] = notifyOnInstruments.map(pair => {
					return pair.slice(0,3) + '/' + pair.slice(3, 6)
				});
            }

            usersManagement.setUsersData(usersData.data, usersData.id);    
           	
           	usersManagement.updateUserDatabaseRecord(user);

		} 
	})

	return {};
}