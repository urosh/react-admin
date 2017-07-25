/*
 * Admin client module entry point. Since the client code is already getting more and 
 * more complex, we need to find a good way to organize client modules. At the moment its
 * a set of modules that communicate to each other using pub/sub event channel. 
 */
(function(){
	
	// Create Connection
	var socket = io('wss://', {
		path:'/live/socket.io',
	//	path: ' https://lcl.lb.com/live232/socket.io/socket.io.js '
	});

	// When admin socket connects, still we have nothing to do, or we do?
	socket.on('connect', () => {
		
		if(username) {
			socket.emit('adminRegister', { username: username });	
		}else{
			$.get('/admin/auth/status', handleAdminConnect);
		}
	});
	
	var panelInitialized = false;
	
	function handleAdminConnect(data) {
		if(!panelInitialized){
			if(data.access === "allowed"){
				username = data.username;
				events.publish(eventNames.admin.SHOW_PANEL, data);
			}else{
				events.publish(eventNames.admin.SHOW_LOGIN, data);
			}
			panelInitialized = true;
		}
	}
	
	

	// When new user connected to the easymarkets, notify admin system and update user stats
	socket.on('userUpdate', function(data) {
		events.publish(eventNames.userStats._UPDATE_, data);
	});

	socket.on('clientNotificationPreview', function(data) {
		events.publish(eventNames.messages._ALERT_PREVIEW_, data);
	});
	

	// This event is triggered when there is a change of a filter on admin page. 
	// When this happens we want to update recipient stats as soon as possible. We are emmiting filter data
	// to the server. Server will then process this data, and send new data to the admin. 
	events.subscribe(eventNames.recipientStats._REQUEST_, function(data){
		socket.emit('recipientStats', {
			username: username,
			filters: data
		});
	});

	events.subscribe(eventNames.admin._PUSH_REGSITER_, function(data){

		data.username = username;
		socket.emit('adminPushRegister', data);
	});

	// Server is notifying admin system, that it has processed filters data, and that new recipient stats are ready.
	socket.on('recipientStats', function(data){
		events.publish(eventNames.recipientStats._UPDATE_, data);
	});

	var username = null;
	// When admin user registers, we notify the server using sockets. Socket is then added to admin room
	// that used to communicate with the admin. 
	events.subscribe(eventNames.authentication._LOGIN_, function(data) {
		username = data.username;
		socket.emit('adminRegister', data);	
	});


})();
