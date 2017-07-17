"use strict";
const parameters = require('../parameters');
const globalPairs = require('../config').globalPairs;
let io;
const UsersModel = require('../../models/user');
const _ = require('lodash');

module.exports = function(){
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
		[parameters.user.LANGUAGE]: ''
	}

	const user = {
		[parameters.user.USER_ID]: '',
		[parameters.messageChannels.MACHINE_HASH]: '',
		[parameters.messageChannels.TOKEN]: '',
		[parameters.user.USER_LOGGED_IN]: false,
		[parameters.user.PAIRS]: [],
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

	let users = {};

	let serverID;

	const setServerId = id => {
		serverID = id;
	}

	/*
	 * API function that gives access to the users object 
	 */
	const getUsers = () => users;

	const getUser = id => users[id];

	const getUserModel = () => user;

	const getMobileUser = token => {
		return Object.keys(users)
			.map(id => users[id])
			.filter(user => {
				return (user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === token)).length
			})[0]
	}
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

	const getIdParameter = user => {
		if(user[parameters.user.USER_ID]) {
			return parameters.user.USER_ID;
		}else if(user[parameters.messageChannels.MACHINE_HASH]){
			return parameters.messageChannels.MACHINE_HASH;
		}else{
			return parameters.messageChannels.TOKEN;
		}
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


	const init = () => {
		UsersModel
			.find()
			.exec()
			.then(savedUsers => {
				savedUsers.forEach(savedUser => {
					let id = getUserId(savedUser);
					if(!users[id]){
						users[id] = {};
						Object.keys(user)
								.forEach(key => users[id][key] = savedUser[key])
						users[id][parameters.messageChannels.SOCKETS] = [];	
						
					}
				})
				console.log('[Users Management] retreiving data from the database');
			})
	}

	/*
	 * Helper functions to get socket/push/browser object from users object. It is
	 * used when we need to modify object record when updating user's data
	 * 
	 * @param string users id
	 * @param string socketId/machineHash
	 * @return void
	 */

	const getSocketObject = (id, socketId) => {
		const user = users[id];
		if(!user) return null;
		return user[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === socketId)[0];
	}

	const getPushObject = (id, machineHash) => {
		const user = users[id];
		if(!user) return null;
		return user[parameters.messageChannels.PUSH].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] === machineHash)[0];
	}

	const getBrowserObject = (id, machineHash) => {
		const user = users[id];
		if(!user) return null;
		return user[parameters.messageChannels.BROWSERS].filter(machine => machine[parameters.messageChannels.MACHINE_HASH] === machineHash)[0];
	}

	const getMobileObject = (id, token) => {
		const user = users[id];
		if(!user) return null;
		return user[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === token)[0];
	}

	const getMobileObjectFromToken = token => {
		if (!token) return {};

		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev[parameters.messageChannels.TOKEN]) return prev;
				let res = current[parameters.messageChannels.MOBILES].filter(mobile => mobile[parameters.messageChannels.TOKEN] === token);
				if(res.length) return res[0];
				return {};
			}, false)
	}

	const getBrowserObjectFromMachineHash = machineHash => {
		if (!machineHash) return {};

		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev[parameters.messageChannels.MACHINE_HASH]) return prev;
				let res = current[parameters.messageChannels.BROWSERS].filter(browser => browser[parameters.messageChannels.MACHINE_HASH] === machineHash);
				if(res.length) return res[0];
				return {};
			}, false)
	}

	const getSocketObjectFromSocketId = id => {
		if (!id) return {};

		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev[parameters.messageChannels.SOCKET_ID]) return prev;
				let res = current[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === id);
				if(res.length) return res[0];
				return {};
			}, false)
	}

	const getSocketUser = socketId => {
		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				if(prev) return prev;
				let res = current[parameters.messageChannels.SOCKETS].filter(socket => socket[parameters.messageChannels.SOCKET_ID] === socketId);
				if(res.length) return current;
				return null;
			}, false)
	}

	const getMarketAlertPushUsers = instrument => {
		let userID;
		let pushRegistrations = Object.keys(users)
			.map(id => 	users[id])
			.filter(user => user[parameters.user.MARKET_ALERT_ALLOW])
			.filter(user => user[parameters.messageChannels.PUSH].length > 0)
			.filter(user => user[parameters.user.PAIRS].indexOf(parameters.user.INSTRUMENT + '-' + instrument) > -1)
			.map(user => user[parameters.messageChannels.PUSH]);
		
		let push = [].concat.apply([], pushRegistrations);
		
		return push.filter(push => push[parameters.messageChannels.PUSH_ACTIVE])
			.filter(push => push[parameters.general.SERVER_ID] === serverID);
	}

	const getMarketAlertMobileUsers = instrument => {
		let userID;
		let mobileRegistrations = Object.keys(users)
			.map(id => 	users[id])
			.filter(user => user[parameters.user.MARKET_ALERT_ALLOW])
			.filter(user => user[parameters.messageChannels.MOBILES].length > 0)
			.map(user => user[parameters.messageChannels.MOBILES]);
		
		let mobiles = [].concat.apply([], mobileRegistrations);
		
		return mobiles.filter(push => push[parameters.general.SERVER_ID] === serverID);
	}

	const removePushRegistrations = token => {
		if(!token) return;

		Object.keys(users)
			.map(id => users[id])
			.map(user => {
				user[parameters.messageChannels.PUSH] = user[parameters.messageChannels.PUSH].filter(push => push[parameters.messageChannels.TOKEN] !== token);
				return user;
			});
	}

	const removeBrowserFromUser = machineHash => {
		if(!machineHash) return;
		Object.keys(users)
			.map(id => users[id])
			.map(user => {
				user[parameters.messageChannels.BROWSERS] = user[parameters.messageChannels.BROWSERS].filter(browser => browser[parameters.messageChannels.MACHINE_HASH] !== machineHash);
				return user;
			});
	}

	const updateUserDatabaseRecord = (user) => {
		let parameter = getIdParameter(user), 
			value = user[parameter];

		//console.log('Updating user in database: ', parameter, value);

		if(user[parameters.messageChannels.PUSH].length === 0 && user[parameters.messageChannels.MOBILES] === 0){
			UsersModel
				.remove({ [parameter]: value });
		}else{
			UsersModel
				.findOneAndUpdate({ [parameter]: value }, user, { upsert: true, new: true })
				.exec()
				.then(res => {
					return res;
				})
		}
	}
	
	const getNumberOfUsers = () => Object.keys(users).length;
	const getNumberOfLoggedOutUsers = () => {
		return Object.keys(users)
				.map(id => users[id])
				.filter(user => !user[parameters.user.USER_ID]).length;

	}
	const getNumberOfLoggedInUsers = () => {
		return Object.keys(users)
				.map(id => users[id])
				.filter(user => user[parameters.user.USER_ID]).length;
	}
	const getNumberOfMobileUsers = () => {
		
		return Object.keys(users)
			.map(id => users[id])
			.reduce((prev, current) => {
				return prev + current[parameters.messageChannels.MOBILES].length
			}, 0);
	}

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
						res.remove()
					}
				});
		})
			
	}

	return {
		init,
		setServerId,
		generateUserPairs,
		joinRooms,
		getUser,
		getUserModel,
		getUsers,
		getUserId,
		getMobileUser,
		getMobileObject,
		getMobileObjectFromToken,
		getBrowserObjectFromMachineHash,
		getSocketObjectFromSocketId,
		getPushObject,
		getSocketObject,
		getSocketUser,
		getSocket,
		getMarketAlertPushUsers,
		getMarketAlertMobileUsers,
		removePushRegistrations,
		removeBrowserFromUser,
		updateUserDatabaseRecord,
		getUsersStats,
		cleanUsersObject
	}
}
