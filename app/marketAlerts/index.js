module.exports = (marketAlerts, usersManagement) => {
	require('./browserConnections')(marketAlerts, usersManagement);
	require('./api')(marketAlerts,usersManagement);
	require('./mobileConnections')(marketAlerts, usersManagement);
	require('./pushConnections')(marketAlerts, usersManagement);
	require('./triggers')(marketAlerts, usersManagement);
}