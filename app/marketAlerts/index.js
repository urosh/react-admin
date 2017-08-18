module.exports = (marketAlerts, usersManagement) => {
	require('./triggers')(marketAlerts, usersManagement);
	require('./tracking')(marketAlerts, usersManagement);
	require('./messageTriggers')(marketAlerts, usersManagement);
	require('./redisSocketTrigger')(marketAlerts, usersManagement);
}