module.exports = (clients, usersManagement) => {
	require('./browserConnections')(clients, usersManagement);
	require('./mobileConnections')(clients, usersManagement);
	require('./pushConnections')(clients, usersManagement);
	require('./api')(clients,usersManagement);
}