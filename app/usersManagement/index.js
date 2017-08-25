"use strict";
const parameters = require('../parameters');
const globalPairs = require('../config').globalPairs;
let io;

const UsersModel = require('../../models/user');
const OldMobileModel = require('../../models/mobile');
const OldPushModel = require('../../models/push');

const _ = require('lodash');
const config = require('../config');
let sql = require('mssql');
const fs = require('fs');
const languages = ['en', 'zh-hans', 'pl', 'ar'];

module.exports = function(){
	let users = {};
	
	const socketConnection = {
		[parameters.messageChannels.SOCKET_ID]: '',
		[parameters.messageChannels.SOCKET_ACTIVE]: '',
		[parameters.user.LANGUAGE]: '',
		[parameters.messageChannels.MACHINE_HASH]: ''
	};

	const browser = {
		[parameters.messageChannels.MACHINE_HASH]: '',
		[parameters.messageChannels.TOKEN]: '',
		[parameters.user.LANGUAGE]: '',
		[parameters.messageChannels.PUSH_ENABLED]: false,
		[parameters.user.TEST_ENABLED]: false,
		[parameters.messageChannels.PUSH_ACTIVE]: false
	}

	const push = {
		[parameters.messageChannels.MACHINE_HASH]: '',
		[parameters.messageChannels.TOKEN]: '',
		[parameters.user.LANGUAGE]: '',
		[parameters.messageChannels.PUSH_ACTIVE]: false
	}

	const mobile = {
		[parameters.messageChannels.TOKEN]: '',
		[parameters.user.LANGUAGE]: '',
		[parameters.user.USER_ID]: null,
		[parameters.messageChannels.SYSTEM]: '',
		[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD]: '',
	}

	const user = {
		[parameters.user.USER_ID]: null,
		[parameters.messageChannels.MACHINE_HASH]: '',
		[parameters.messageChannels.TOKEN]: '',
		[parameters.user.USER_LOGGED_IN]: false,
		[parameters.user.PAIRS]: [],
		[parameters.user.MOBILE_PAIRS]: [],
		[parameters.user.TEST_ENABLED]: false,
		[parameters.user.MARKET_ALERT_ALLOW]: true,
		[parameters.user.CULTURE]: 'eu',
		[parameters.user.ACCOUNT_BASE_CURRENCY]: null,
		[parameters.user.ALLOW_DEPOSIT]: null,
		[parameters.user.ALLOW_WITHDRAWAL]: null,
		[parameters.user.ALLOWED_CANCELLATION]: null,
		[parameters.user.COUNTRY_NAME]: null,
		[parameters.user.COUNTRY_ID]: null,
		[parameters.user.DEFAULT_PORTAL]: null,
		[parameters.user.DEMO_EXPIRATION_DAYS]: null,
		[parameters.user.HAS_CREDIT_CARD]: null,
		[parameters.user.HAS_MT4_ACCOUNT]: null,
		[parameters.user.IS_ACTIVE]: null,
		[parameters.user.IS_ACCOUNT_CLOSED]: null,
		[parameters.user.WITHDRAWAL_AVAILABLE]: null,
		[parameters.messageChannels.PUSH]: [],
		[parameters.messageChannels.SOCKETS]: [],
		[parameters.messageChannels.BROWSERS]: [],
		[parameters.messageChannels.MOBILES]: [],
	}
	
	const usersFiltering = require('./usersFiltering')(users);
	/*
	 * Helper methods
	 */
	
	/* 
	 * Helper function to get user identifier. 
	 * 
	 * It checks if there is userId in data object and returns it if there 
	 * (Logged in users). If userId is null return machineHash (Logged out users).
	 *
	 * @param object data. Users data
	 * @return string id. 
	 */
	const getUserId = data => {
		return data[parameters.user.USER_ID] || data[parameters.messageChannels.MACHINE_HASH] || data[parameters.messageChannels.TOKEN];
	}

	/*
	 * Helper function that returns elements from target array that are 
	 * not present in source. 
	 * 
	 * The function is used to determine rooms that need to be joined/left by sockets
	 *
	 * @param array target
	 * @param array source
	 * @return array
	 */
	const getArrayDifference = (target, source, io) => {
		return target.filter(t => source.indexOf(t) === -1);
	}

	/*
	 * Facade to getting the socket instace from socketId
	 *
	 * @param string socketId
	 * @param object io socketio instance
	 * @return object socket instance
	 *
	 */
	const getSocket = (socketId, io) => io.sockets.connected[socketId];
	
	/*
	 * Helper function that sets correct pair format. It is used as a room for sockets
	 * on different languages. 
	 * 
	 * @param object socket
	 * @param string instrument
	 * @return array Array of rooms that socket needs to join for a given pair
	 *
	 */
	const setInstrumentFormat = (socket, instrument) => {
		let rooms = [];
		if(instrument.indexOf(parameters.user.INSTRUMENT) > -1) {
			rooms.push(socket[parameters.user.LANGUAGE] + '-' + instrument);
			if(socket[parameters.user.TEST_ENABLED]) {
				rooms.push(parameters.general.TEST + '-' + socket[parameters.user.LANGUAGE] + '-' + instrument)
			}
		}else{
			rooms.push(instrument);
		}	
		return rooms;
	}

	/*
	 * Helper function that gives access to the browser object 
	 * within users' data
	 * 
	 * @param string id user's id
	 * @param string machineHash machine identifier
	 * @return object browser's data object
	 *
	 */
	const getBrowserObject = (user, machineHash) => {
		if(!user) return {};
		let browserObject = user[parameters.messageChannels.BROWSERS].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] === machineHash);
		return browserObject.length > 0 ? browserObject[0] : {} 
	}
	
	/*
	 * Helper function that searches users to lookup users based on 
	 * socketId
	 * 
	 * @param string socketId
	 * @return object users' data
	 *
	 */
	const getSocketUser = (socketId) => {
		return _.cloneDeep(Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(!_.isEmpty(prev)) return prev;
				let res = current[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === socketId);
				if(res.length) return current;
				return {};
			}, {}))
	}

	// Helper function that returns number of registered users
	const getNumberOfUsers = () => Object.keys(users).length;
	
	/*
	 * Helper function that returns number of logged out users
	 * @param void
	 * @return number
	 */
	const getNumberOfLoggedOutUsers = () => {
		return Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parameters.user.USER_ID]).length;
	}
	/*
	 * Get number of logged in users
	 */
	const getNumberOfLoggedInUsers = () => {
		return Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.user.USER_ID]).length;
	}

	/*
	 * Get number of mobile users
	 */
	const getNumberOfMobileUsers = () => {
		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				return prev + current[parameters.messageChannels.MOBILES].length
			}, 0);
	}

	const getUsersDataFromMssql = id => {
		let queryString = "EXEC pim.usp_user_details_get " + id;
		let response = {
			[parameters.user.MARKET_ALERT_ALLOW]: true,
			[parameters.user.MOBILE_PAIRS]: []
		};

		return new Promise((fullfill, reject) => {
			if(sql.error) {
				fullfill(response)
				return;
			}
			new sql.Request().query(queryString)
					.then(function(data) {
						if(data && data.recordset && data.recordset.length > 0){
						    response[parameters.user.MARKET_ALERT_ALLOW] = !!data.recordset[0].MarketAlertAllow;

						    if(data.recordset[0].InstrumentNotifications){
						    	response[parameters.user.MOBILE_PAIRS] = data.recordset[0].InstrumentNotifications
							    	.split(',')
							    	.map(pair => {
								    	if(pair.length === 6){
									    	return pair.slice(0,3) + '/' + pair.slice(3, 6);
								    	}
								    	return '';
							    	})
							    	.filter(pair => pair);
				            }
						    console.log(`Mssql Database: Retrieving data for user User [${id}]. Instruments, marketAlertAllow`, response[parameters.user.MOBILE_PAIRS],  response[parameters.user.MARKET_ALERT_ALLOW]);
						}
						fullfill(response);
				    })
				    .catch(err => {
						console.log(`There was an error while retreiving users [${id}] data from the mssql database`);
						fullfill(response);
					});

		})
	}

	const getUsersDatabaseRecords = () => {
		
		if(config.loadDataFromDatabase)	return;
		
		console.log('[Users Management] retreiving data from the database');

		UsersModel
		.find()
		.exec()
		.then(savedUsers => {
			savedUsers.forEach(savedUser => {
				
				let id = getUserId(savedUser);
				if(!users[id]){
					// Parse and store user's object from mongodb
					users[id] = JSON.parse(JSON.stringify(savedUser));
					
					// Delete keys added by mongodb, we dont need them in our user's object
					Object.keys(users[id])
						.forEach(key => {
							if(!(key in user)){
								delete users[id][key]
							}
					})

					users[id][parameters.messageChannels.SOCKETS] = [];	
				}
			})

			if(!sql.error){
				Object.keys(users)
					.map(id => users[id])
					.filter(user => user[parameters.user.USER_ID])
					.forEach(user => {
						let queryString = "EXEC pim.usp_user_details_get " + user[parameters.user.USER_ID];
						
						getUsersDataFromMssql(user[parameters.user.USER_ID])
							.then(data => {
								// Check if we need to update the mongo db
								let updateMongo = false;
								
								if(user[parameters.user.MARKET_ALERT_ALLOW] !== data[parameters.user.MARKET_ALERT_ALLOW]){
									user[parameters.user.MARKET_ALERT_ALLOW] = data[parameters.user.MARKET_ALERT_ALLOW];
									updateMongo = true;
								}
								
								if(!user[parameters.user.MOBILE_PAIRS]){
									user[parameters.user.MOBILE_PAIRS] = [];
									updateMongo = true;
								}
								
								if( !updateMongo &&  (user[parameters.user.MOBILE_PAIRS].sort().join(',') !== data[parameters.user.MOBILE_PAIRS].sort().join(',')) ){
									updateMongo = true;
									user[parameters.user.MOBILE_PAIRS] = [...data[parameters.user.MOBILE_PAIRS]];
								}

							    if(updateMongo){
							    	updateUserDatabaseRecord(user);
							    }
							})
					})
			}
			
		})
		
		
	}
	/*
	 * API function that gives access to the users object 
	 */
	
	/*
	 * Init function kicked off on server start
	 */
	const init = () => {
		sql.error = true;
		sql.connect(config.mssql.host)
			.then(() => {
				sql.error = false;
				console.log(`MSSQL database [${config.mssql.host}] connection established`.green);

				getUsersDatabaseRecords();
			})
			.catch((err) => {
				sql.error = true;
				getUsersDatabaseRecords();
				console.log(`There was an error connecting to the MSSQL database: ${config.mssql.host} `.red + err);
			});
	}
	
	// Pass user's object template
	const getUserModel = () => _.cloneDeep(user);

	// Get user based on id
	const getUser = id => {
		if(!id || !users[id]) return {};
		return _.cloneDeep(users[id]);
	}
	
	// Get user from mobile token
	const getMobileUser = token => {
		let user = Object.keys(users)
			.map(id => users[id])
			.filter(user => {
				return (user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === token)).length
			})

		return user.length > 0 ? _.cloneDeep(user[0]) : {};
	}

	const getPushUser = token => {
		let user = Object.keys(users)
			.map(id => users[id])
			.filter(user => {
				return (user[parameters.messageChannels.PUSH].filter(push => push[parameters.messageChannels.TOKEN] === token)).length
			})

		return user.length > 0 ? _.cloneDeep(user[0]) : {};
	}
	
	/*
	 * Preparing browser push users list for market alerts
	 * 
	 * @param string instrument
	 * @return array users list
	 * 
	 */
	const getMarketAlertPushUsers = instrument => {
		let userID;
		let pushRegistrations = Object.keys(users)
			.map(id => 	users[id])
			// Check market alert allow flag
			.filter(user => user[parameters.user.MARKET_ALERT_ALLOW])
			// Check if there are push notification registrations for this user
			.filter(user => user[parameters.messageChannels.PUSH].length > 0)
			// Make sure instrument is in the pairs list
			.filter(user => user[parameters.user.PAIRS].indexOf(parameters.user.INSTRUMENT + '-' + instrument) > -1)
			// Pass push notification registration data only
			.map(user => user[parameters.messageChannels.PUSH]);
		
		let push = [].concat.apply([], pushRegistrations);

		// Make sure we are sending alerts only to the users on the server that received registration
		return push.filter(push => push[parameters.messageChannels.PUSH_ACTIVE])
	}
	
	/*
	 * Preparing mobile market alerts receivers list
	 */
	const getMarketAlertMobileUsers = instrument => {
		let userID;
		let mobileRegistrations = Object.keys(users)
			.map(id => 	users[id])
			// Check the marketAlertAllow flag first
			.filter(user => user[parameters.user.MARKET_ALERT_ALLOW])
			// Make sure the user has mobile app registered
			.filter(user => user[parameters.messageChannels.MOBILES].length > 0)
			.filter(user => user[parameters.user.MOBILE_PAIRS])
			.filter(user => user[parameters.user.MOBILE_PAIRS].indexOf(instrument) > -1)
			// Return actuall mobile app registration
			.map(user => user[parameters.messageChannels.MOBILES])
			
		
		let mobiles = [].concat.apply([], mobileRegistrations);
		
		return mobiles;
	}
	
	/*
	 * Get market alert receives based on the instrument. 
	 * 
	 * Runs when market alert trigger is received. The result is receivers object that separate receivers
	 * based on device type, delivery method and language. 
	 *
	 */
	const getMarketAlertReceivers = instrument => {
		
		// Initialize receivers object
		let receivers = {
			push: {},
			fcmMobile: {},
			pushyMobile: {}
		}
		
		// Initialize language based information
		languages.map(language => {
			receivers.push[language] = [];
			receivers.fcmMobile[language] = [];
			receivers.pushyMobile[language] = []
		});
			
		// Go through the user registrations and populate receivers object
		Object.keys(users)
			.map(id => users[id])
			.filter(user => user[parameters.user.MARKET_ALERT_ALLOW])
			// Filter out users we know should not receive the alert
			.forEach(user => {
				// Add browser push tokens if received instrument is in the pairs array
				if(user[parameters.user.PAIRS].indexOf((parameters.user.INSTRUMENT + '-'+ instrument)) > -1) {
					user[parameters.messageChannels.PUSH].map(pushRegistration => {
						if(pushRegistration[parameters.messageChannels.PUSH_ACTIVE] && pushRegistration[parameters.user.LANGUAGE]){

							receivers.push[pushRegistration[parameters.user.LANGUAGE]].push(pushRegistration[parameters.messageChannels.TOKEN])
						}
					})
				}
				
				// If instrument is not in the pairs and mobile pairs do not exist the user is left out
				if(!user[parameters.user.MOBILE_PAIRS] || user[parameters.user.MOBILE_PAIRS].indexOf(instrument) === -1){
					return 
				}
				
				// Distribute mobile tokens according to language and delivery method			
				user[parameters.messageChannels.MOBILES].map(mobileRegistration => {
					if(mobileRegistration[parameters.user.LANGUAGE] && mobileRegistration[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD]){
						if(mobileRegistration[parameters.messageChannels.NOTIFICATION_DELIVERY_METHOD] === 'pushy'){
							receivers.pushyMobile[mobileRegistration[parameters.user.LANGUAGE]].push(mobileRegistration[parameters.messageChannels.TOKEN])
						}else{
							receivers.fcmMobile[mobileRegistration[parameters.user.LANGUAGE]].push(mobileRegistration[parameters.messageChannels.TOKEN])
						}
					}
				})
			})
			
		return receivers;
	}

	/*
	 * Get current users stats
	 */
	const getUsersStats = () => {
		let totalUsers, 
			loggedInUsers, 
			loggedOutUsers,
			mobileUsers;
		
		loggedInUsers = getNumberOfLoggedInUsers();
		loggedOutUsers = getNumberOfLoggedOutUsers();
		mobileUsers = getNumberOfMobileUsers();
		totalUsers = getNumberOfUsers();

		var results = {
			totalUsers,
			loggedInUsers,
			loggedOutUsers,
			mobileUsers
		};
		
		return results;
	}

	
	/*
	 * Helper functions to get socket/push/browser object from users object. It is
	 * used when we need to modify object record when updating user's data
	 * 
	 * @param string users id
	 * @param string socketId/machineHash/token
	 * @return object socket/push/mobile registration object
	 *
	 */
	const getSocketObject = (user, socketId) => {
		if(!user) return {};
		let socketObject = user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === socketId);
		return socketObject.length > 0 ? socketObject[0] : {}
	}

	const getPushObject = (user, machineHash) => {
		if(!user) return {};
		let pushObject = user[parameters.messageChannels.PUSH].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] === machineHash);
		return pushObject.length > 0 ? pushObject[0] : {};
	}

	const getMobileObject = (user, token) => {
		if(!user) return {};
		let mobileObject = user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === token);
		return mobileObject.length ? mobileObject[0] : {}
	}
	
	
	/*
	 * Helper method that searches through the user registrations
	 * and looks for provided mobile machine hash. If search is successfull it returns
	 * browser object
	 */
	const getBrowserObjectFromMachineHash = machineHash => {
		if (!machineHash) return {};

		return _.cloneDeep(Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev[parameters.messageChannels.MACHINE_HASH]) return prev;
				let res = current[parameters.messageChannels.BROWSERS].filter(browser => browser[parameters.messageChannels.MACHINE_HASH] === machineHash);
				if(res.length) return res[0];
				return {};
			}, false));
	}
	
	/*
	 * Helper function that searches through registrations and looks for provided socketId in the 
	 * sockets object. If search is successful it returns socket registration
	 */
	const getSocketObjectFromSocketId = id => {
		if (!id) return {};

		return _.cloneDeep(Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev[parameters.messageChannels.SOCKET_ID]) return prev;
				let res = current[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === id);
				if(res.length) return res[0];
				return {};
			}, {}))
	}



	
	/*
	 * Adding socket to given rooms
	 * 
	 * Used to join rooms, when registering sockets, user status changes or tab visibility changes
	 * 
	 * @param object socket. Socket instance
	 * @param array rooms. Rooms to join
	 * @return void
	 */
	 const joinRooms = (socket, rooms) => {
		if(!socket || !rooms) return;
		
		let recievedRooms = [];
		let join = [];
		let leave = [];
		
		// Transform rooms array to correct format
		rooms.forEach(room => {
			recievedRooms = recievedRooms.concat(setInstrumentFormat(socket, room));
		})
		
		const currentRooms = [...Object.keys(socket.rooms).filter(pair => pair.indexOf(parameters.user.INSTRUMENT) > -1)];
		
		join = getArrayDifference(recievedRooms, currentRooms);
		leave = getArrayDifference(currentRooms, recievedRooms);
		
		join.forEach(room => {
			socket.join(room);
		});

		leave.forEach(room => {
			socket.leave(room);
		});
			
	 }

	/*
	 * Helper function that generates instrument pairs based on user's data
	 *
	 * It checks if user is logged in or out, marketAlertAllow flag, testEnabled flag
	 * and personal favorites, and returns array of pairs relevant to the user. 
	 *
	 * @param object user's data
	 * @return array Instrument pairs. 
	 */ 
	const generateUserPairs = (data) => {
		let pairs = [];
		const userLoggedIn = data[parameters.user.USER_LOGGED_IN];
		const language = data[parameters.user.LANGUAGE];
		const culture = data[parameters.user.CULTURE];
		const usersPairs = data[parameters.user.PAIRS];
		const machineHash = data[parameters.messageChannels.MACHINE_HASH];
		const userId = data[parameters.user.USER_ID];
		const marketAlertAllow = data[parameters.user.MARKET_ALERT_ALLOW];
		const testEnabled = data[parameters.user.TEST_ENABLED];

		// If user is logged out add machine hast to pairs, to be able to 
		// target logged out users
		if(!userLoggedIn){
			pairs.push(language + '-' + machineHash);
		}else{
			// Add user id, to be able to target users
			pairs.push(language + '-' + userId);
		}
		// If market alerts are not allowed 
		if(!marketAlertAllow) return pairs;
		
		// Add global pairs
		globalPairs.forEach(pair => {
			pairs.push(parameters.user.INSTRUMENT + '-' + pair);
		});
		
		// For logged out users its enough
		if(!userLoggedIn) return pairs;

		// Add language 
		pairs.push(language);
		
		pairs.push(language + '-' + culture)
		
		usersPairs.forEach(pair => {
			if(pairs.indexOf(parameters.user.INSTRUMENT + '-' + pair) === -1){
				pairs.push(parameters.user.INSTRUMENT + '-' + pair);
			}
		})

		return pairs;
	}

	/*
	 * Helper function that determines which parameter is used as a key in the 
	 * users object for the provided user. Based on the user status we can have three different 
	 * parameters used as user's key. 
	 */
	const getIdParameter = user => {
		if(user[parameters.user.USER_ID]) {
			return parameters.user.USER_ID;
		}else if(user[parameters.messageChannels.MACHINE_HASH]){
			return parameters.messageChannels.MACHINE_HASH;
		}else{
			return parameters.messageChannels.TOKEN;
		}
	}

	const updateUserDatabaseRecord = (user) => {
		let parameter = getIdParameter(user), 
			value = user[parameter];
		
		if(user[parameters.messageChannels.PUSH].length === 0 && user[parameters.messageChannels.MOBILES].length === 0){
			UsersModel
				.find({ [parameter]: value })
				.remove()
				.exec();
			
		}else{
			UsersModel
				.findOneAndUpdate({ [parameter]: value }, user, { upsert: true, new: true })
				.exec()
				.then(res => {
					console.log(`Mongo: Updating user [${user[parameter]}]`);
					return res;
				})
		}
	}
	

	const removePushRegistrations = (token) => {
		
		if(!token) return;
		
		let updatePushList = [];

		Object.keys(users)
			.map(id => users[id])
			.map(user => {
				user[parameters.messageChannels.PUSH] = user[parameters.messageChannels.PUSH] = user[parameters.messageChannels.PUSH].filter(push => {
						if(push[parameters.messageChannels.TOKEN] !== token){
							return true;
						}
						updatePushList = addUniqueUserToArray(updatePushList, user);
						return false;
					})

				return user;
			})
		updatePushList.map(user => {
			let u = _.cloneDeep(user);
			updateUserDatabaseRecord(u)
		});

	}
	
	const addUniqueUserToArray = (arr, obj) => {
		return arr.filter(user => getUserId(user) !== getUserId(obj)).concat([obj]);
	}

	const removeMobileFromUsers = (token, deviceId) => {
		let updateDeviceList = [];
		Object.keys(users)
			.map(id => users[id])
			.map(user => {
				
				if(!token) return user;
				
				// Check if this user has the mobile with provided token
				if(_.find(user[parameters.messageChannels.MOBILES], {[parameters.messageChannels.TOKEN]: token})){
					user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(u => u[parameters.messageChannels.TOKEN] !== token)
					updateDeviceList = addUniqueUserToArray(updateDeviceList, user);	
				}
				if(!deviceId) return user;
				
				if(_.find(user[parameters.messageChannels.MOBILES], {[parameters.messageChannels.DEVICE_ID]: deviceId})){
					user[parameters.messageChannels.MOBILES] = user[parameters.messageChannels.MOBILES].filter(u => u[parameters.messageChannels.DEVICE_ID] !== deviceId)
					updateDeviceList = addUniqueUserToArray(updateDeviceList, user);
				}
				return user;
			})
		if(users[token]){
			updateDeviceList = addUniqueUserToArray(updateDeviceList, users[token]);
			delete users[token];
		}
		
		updateDeviceList.map(user => {
			let u = _.cloneDeep(user);
			updateUserDatabaseRecord(u)
		});
	}
	
	const cleanUsersObject = () => {
		let ids = [];
		Object.keys(users)
			.forEach(id => {
				let user = users[id];
				if(user[parameters.messageChannels.SOCKETS].length === 0 && user[parameters.messageChannels.PUSH].length === 0 && user[parameters.messageChannels.MOBILES].length === 0){
					ids.push(id);
				}
			})
		
		ids.forEach(id => {
			let idParameter = getIdParameter(users[id]);
			delete users[id];
			UsersModel.findOne({[idParameter]: id})
				.exec()
				.then(res => {
					if(res){
						res
							.remove()
							.exec();
					}
				});
		})
			
	}

	const setUsersData = (data, id) => {
		
		if(!id) return;

		if(_.isEmpty(data)){
			delete users[id]
			return;
		}
		
		if(
			data[parameters.messageChannels.MOBILES].length === 0 && 
			data[parameters.messageChannels.PUSH].length === 0 && 
			data[parameters.messageChannels.SOCKETS].length === 0
		){
			delete users[id];
			return;
		}

		users[id] = _.cloneDeep(data);
	}

	const getUsersTestMethod = () => users;
	
	const getSqlConnection = () => {
		if (sql.error) return null;
		return sql;
	};

	return {
		init,
		generateUserPairs,
		joinRooms,
		getUser,
		getUsersTestMethod,
		getUserModel,
		getUserId,
		getMobileUser,
		getMobileObject,
		getSocketObjectFromSocketId,
		getSocketUser,
		getSocket,
		getSocketObject,
		getPushObject,
		getPushUser,
		getMarketAlertPushUsers,
		getMarketAlertMobileUsers,
		getMarketAlertReceivers,
		removePushRegistrations,
		removeMobileFromUsers,
		updateUserDatabaseRecord,
		getUsersStats,
		cleanUsersObject,
		getIdParameter,
		usersFiltering,
		setUsersData,
		getSqlConnection,
		getUsersDataFromMssql
	}
}
