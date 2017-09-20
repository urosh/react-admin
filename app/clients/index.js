/*
 * Group of events related to managing clients connections. 
 * Currently browser sockets/push notifications and mobile device connections are 
 * supported. 
 * 
 * Browsers are communicating using sockets, while mobile app uses http rest api
 * to communication to the server. 
 * 
 */
module.exports = (clients, usersManagement) => {
	require('./browserConnections')(clients, usersManagement);
	require('./mobileConnections')(clients, usersManagement);
	require('./pushConnections')(clients, usersManagement);
	require('./api')(clients,usersManagement);
}