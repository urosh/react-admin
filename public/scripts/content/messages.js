(function(){

	/**
	 * Declare variables used in the module
	 * 
	 */
	var sendMessageButton,
		previewMessageButton,
		dashboardContent,
		messageInputContainer,
		userListContainer,
		selectedUserListContainer,
		userList = [],
		selectedUserList = [],
		cultures = 'All cultures',
		culturesSelection,
		userType = 'All users',
		userSelection,
		userStats,
		messageType = 'All',
		messageTypeSelection,
		languages = [],
		inputs,
		username,
		messageSubscription,
		modalContent;
	
	var languages = [
		{
			code: "en",
			value: "English"
		},
		{
			code: "pl",
			value: "Polish"
		},
		{
			code: "ar",
			value: "Arabic"
		},
		{
			code: "zh-hans",
			value: "Chinese"
		}
	];
	
	dashboardContent = $('#dashboard-content');
	
	// Subscribe to send messages selected event. When users clicks on send messages 
	// in the panel menu, the event is fired. 
	messageSubscription = events.subscribe(eventNames.messages._INIT_, function(user) {
		// Load messages template and add it to the dashboard
		username = user.username;
		$.ajax({
		    url: "templates/messages/messages.html",
		    cache: false,
		    dataType: "html",
		    success: function(data) {
		    	// Set panel data
		    	dashboardContent.empty();
		        dashboardContent.html(data);
		        
		        messageInputContent = $('.messages-input-holder .row');
		        
		        // Get a list of languages 
		        userListContainer = $('.user-list-container');
		        userListContainer.on('click', '.user-id-button', selectUser);
		        selectedUserListContainer = $('.selected-user-list-container');
		        messagesInit();
		        
		    }
		});
	});

	// Filter object that is currently used. 
	var filters = {
		cultures: 'All cultures', 
		userType: 'Logged in',
		testUsers: 'All users',
		messageType: 'All',
		selectedUsers: []
	};
	var selectedUsers = [];
	/**
	 * Message module init function. Called when user selects send messages option in the admin panel. 
	 * 
	 */
	var pushNotificationRegistered = false;

	function messagesInit() {
		$('.selectpicker').selectpicker({
		  	size: 4
		});
		
		if(!pushNotificationRegistered){
			pushNotificationRegistered = true;	
			registerPushNotifications();
		}
		selectedUsers = [];

		events.subscribe(eventNames.userStats._UPDATE_, (data) => {
			setStats(data);
		});
		events.subscribe(eventNames.recipientStats._UPDATE_, recipientStatsReady);

		// When modifying filters, we want to update recipient stats straight away 
		$('.selectpicker.cultures').change(function(e){
			filters.cultures = $(e.currentTarget).find("option:selected").text();
			getRecipientStats();
		});
		$('.selectpicker.users').change(function(e){
			filters.userType = $(e.currentTarget).find("option:selected").text();
			getRecipientStats();
		});
		$('.selectpicker.alert').change(function(e){
			filters.messageType = $(e.currentTarget).find("option:selected").text();
			getRecipientStats();
		});
		$('.selectpicker.test-users').change(function(e){
			filters.testUsers = $(e.currentTarget).find("option:selected").text();
			getRecipientStats();
		});
		
		userSelection = $('.messages-filter-holder');
  		userStats = userSelection.find('.user-stats')[0];

		sendMessageButton = $('.message-btn');
		previewMessageButton = $('.message-preview-btn');
		modalContent = $('#adminModal .modal-content');

	
		$.ajax({
		    url: "templates/messages/message-input.html",
		    cache: false,
		    dataType: "html",
		    success: function(data) {
		    	// Set panel data
		    	
		    	languages = languages.sort(function(a, b) {
		    		return a.value < b.value;
		    	});
		    	
		    	messageInputContent.empty();
		    	
		    	languages.forEach(function(lang, index) {
					var input = data.replace(/%%code%%/g, lang.code);
		    		input = input.replace(/%%language%%/g, lang.value);
		    		
		    		messageInputContent.append(input);
					$('#message-' + lang.code ).summernote({
						styleTags: ['h1', 'h2', 'h3', 'h4'],
						fontSizes: ['10', '12', '14', '16'],
					  	toolbar: [
						    ['style', ['style']],
						    ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
						    ['fontsize', ['fontsize']],
						    ['color', ['color']],
						    ['para', ['ul', 'ol', 'paragraph']],
					  	]
					});
					$('#message-' + lang.code).on('summernote.change', function(we, contents, $editable) {
						//pushText = $('#push-message-' + lang.code).val();
						var clearText = $(contents).text();
						$('#push-message-' + lang.code).val(clearText);
					});
					$('.note-current-color-button').hide();
					$('.note-color .note-icon-caret').addClass('note-icon-font');
					$('.note-color .note-icon-caret').css('color', 'brown');
					
					$('.note-current-color-button').off('click');
					$('.note-current-color').off('click');
					
				});
				
				initializeUserIdFilter();
				setStats();

		    }
		});
	
		
	  	// Initialize stats module
		// This event is fired when we recieve information from the server that new user connected/disconneceted to the 
		// system. When this happens we want to update user stats, and recipient stats. 
		
		
		
		
		
		sendMessageButton.off('click.send').on('click.send', sendMessage);
		previewMessageButton.off('click.preview').on('click.preview', previewMessage);
		
	}

	/**
	 * Prepare Filters function - called when users clicks send or preview button. It transforms various UI states such 
	 * as user culutures, logged in/out users, message type to filter values understood by the server. 
	 */
	function prepareFilters() {
		// Sort out cultures
		switch (filters.cultures) {
			case 'International' : {
				filters.cultures = 'int';
				break;
			}
			case 'All cultures' : {
				filters.cultures = 'all';
				break;
			}
			case 'EU culture' : {
				filters.cultures = 'eu';
				break;
			}
			case 'AU culture' : {
				filters.cultures = 'au';
				break;
			}

		}
		// User types
		switch (filters.userType) {
			case 'All users' : {
				filters.userType = 'all';
				break;
			}
			case 'Logged in' : {
				filters.userType = 'in';
				break;
			}
			case 'Logged out' : {
				filters.userType = 'out';
				break;
			}
		}

		// Setting message type
		switch (filters.messageType) {
			case 'Alert' : {
				filters.messageType = 'alert';
				break;
			}
			case 'Push' : {
				filters.messageType = 'push';
				break;
			}
			case 'All' : {
				filters.messageType = 'all';
				break;
			}
		}

		// Setting test users selection
		switch (filters.testUsers) {
			case 'All users' : {
				filters.testUsers = 'all';
				break;
			}
			case 'Test users' : {
				filters.testUsers = 'test';
				break;
			}
			case 'Non test users' : {
				filters.testUsers = 'non-test';
				break;
			}
		}


	}

	/**
	 * Prepeare actions format. Format for push and socket is a bit different. Also we currently dont know 
	 * what to expect from users since there's no instruction or constraint available for the action field. 
	 * So we need to take into consideration various possibilities and send proper action format to the client. 
	 *
	 * @params String action - action input from user
	 * @returns String - formated action string that is ready to go to client
	 */
	function prepareMessageAction(action) {
		var result = '';
		if(!action) return result;
		if(action.indexOf('http') > -1) return action;
		result = action.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
		result = '/' + result;
		return result; 
	}
	/**
	 * Prepare Message - called before sending the actual message. It shows the current message both alert
	 * and push notificiation on the admin page.
	 * 
	 * @param void
	 * @return void
	 */
	function prepareMessage() {
		var message = {
			push: {
				title: {},
				text: {}
			},
			sockets: {
				title: {},
				text: {}
			},
			action:{},
			adminUsername: username,
			messageEmpty: true
		};

		// Transform UI states to filter values that server can understand
		prepareFilters();

		message.filters = filters;

		languages.forEach(function(lang) {
			pushText = $('#push-message-' + lang.code).val();
			var clearText = $($('#message-' + lang.code).summernote('code')).text();
			if(clearText !== '') message.messageEmpty = false;
			var htmlText = clearText === '' ? '' : $('#message-' + lang.code).summernote('code');
			var action = $('#action-' + lang.code ).val();
			message.action[lang.code] = prepareMessageAction(action);
			message.push.title[lang.code] = 'Client Notification';
			message.push.text[lang.code] = pushText;
			if(pushText !== '') message.messageEmptymessageEmpty = false;
			message.sockets.title[lang.code] = 'Client Notification';
			message.sockets.text[lang.code] = htmlText;
		});
		return message;
	}
	function previewMessage() {
		var message = prepareMessage();
		
		$.ajax({
			type: "POST",
			url: '/live/client-trigger/preview',
			data: JSON.stringify(message),
			dataType: 'text',
			contentType: "application/json",
			success: function(){
				console.log('Messages sent successfuly');
			},
			error: function(){
				console.log('There was a problem while sending the message');
			}
		});
	}
	function sendMessage() {
		// I need values of three select buttons, and all available inputs and their actions. 
		
		$.ajax({
		    url: "templates/messages/message-send-confirmation.html",
		    cache: true,
		    dataType: "html",
		    success: function(data) {
		    	// Set panel data
		    	modalContent.empty();
		    	modalContent.append(data);

		    	$("#adminModal").modal('show');
			  	// I need the sreen height and the modal height
			  	var windowHeight = $(window).height();
			  	setTimeout(function(){
				  	//console.log($('.modal-content').outerHeight());

				  	var modalHeight = $(modalContent).outerHeight();
			    	var marginTop = (windowHeight - modalHeight) / 2;
			    	modalContent.css({'margin-top': marginTop + 'px'});
			    	// add event listeners for ok and cancel buttons
			    	$('.modal-send-message-confirmation .confirm-btn').click(function(){
			    		var message = prepareMessage();
			    		//When sending the message attach user id's to the filter object.
			    		message.filters.selectedUsers = selectedUsers.slice(0);
			    		// check received message
			    		if(message.messageEmpty) {
			    			modalContent.empty();
							modalContent.append('<p>Message fields are empty. Please add some text before sending the message. </p><div class="modal-confirmation-message"><a href="#" class="btn confirm-btn">Ok</a></div>');
							
							$('.modal-confirmation-message .confirm-btn').click(function(){
								$("#adminModal").modal('hide');
							})
			    		}else{
							$.ajax({
								type: "POST",
								url: '/live/client-trigger',
								data: JSON.stringify(message),
								dataType: 'text',
								contentType: "application/json",
								success: function(){
									modalContent.empty();
									modalContent.append('<p>Message sent successfuly</p><div class="modal-confirmation-message"><a href="#" class="btn confirm-btn">Ok</a></div>');
									// After message is sent, remove the id's from filters
									filters.selectedUsers = [];
									$('.modal-confirmation-message .confirm-btn').click(function(){
										$("#adminModal").modal('hide');
									})
								},
								error: function(){
									filters.selectedUsers = [];
									console.log('There was a problem while sending the message');
								}
							});
			    		}
			    	})
			    	$('.modal-send-message-confirmation .cancel-btn').click(function(){
			    		$("#adminModal").modal('hide');
			    	})
		}, 150);
		    }
		});

		
	}

	// Currently this is not the best solution. I am getting the information from the server using sockets, that some interesting
	// event ocured (User connected/disconnected, push registered etc...) Then i am requesting stat data from the server
	// using post request. Instead, when notifying a client that something happened i should send the data also. This would
	// be more efficient. 
	function setStats(data) {
		if(data){
			$('.users-stats .activeUsers span').text(data.totalUsers);
			$('.users-stats .loggedInUsers span').text(data.loggedInUsers);
			$('.users-stats .loggedOutUsers span').text(data.loggedOutUsers);
			$('.users-stats .mobileAppUsers span').text(data.mobileUsers);
			getRecipientStats();
			return;
		}
		var pushUsers = $.getJSON("/api/fetch/push");
		var loggedInUsers = $.getJSON("/api/fetch/users");
		var visitors = $.getJSON("/api/fetch/visitors");
		var mobileAppUsers = $.getJSON("/api/fetch/mobiles");
		
		$.when(pushUsers, loggedInUsers, visitors, mobileAppUsers).done(function(pushData, usersData, visitorsData, mobileAppUsersData) {
			var push = pushData[0];
			var users = usersData[0];
			var visitors = visitorsData[0];
			var mobiles = mobileAppUsersData[0];
			var numberOfPushUsers = Object.keys(push).length, 
				numberOfLoggedInUsers = Object.keys(users).length,
				numberOfVisitors = Object.keys(visitors).length,
				numberOfMobiles = Object.keys(mobiles).length;

			$('.users-stats .activeUsers span').text(numberOfLoggedInUsers + numberOfVisitors + numberOfMobiles);
			$('.users-stats .loggedInUsers span').text(numberOfLoggedInUsers);
			$('.users-stats .loggedOutUsers span').text(numberOfVisitors);
			$('.users-stats .mobileAppUsers span').text(numberOfMobiles);
			getRecipientStats();
		});
		// Update recipient stats when this happens
		
	}


	// Called when we want to update recipients stats
	function getRecipientStats() {
		prepareFilters();
		events.publish(eventNames.recipientStats._REQUEST_, filters);
	}
	
	// User list stream. It emmits new value each time updated list of users is returned from the server
	var userList$ = new Rx.Subject();
	// Filter stream. Stream of user input values
	var userFilter$;
	// Stream of filtered user list that
	var filteredUserList$;
	var oldList = [];

	// When recipient stats are ready, update UI
	function recipientStatsReady(data) {
		$('.users-stats .overall span').text(data.alerts + data.push + data.mobiles);
		$('.users-stats .alerts span').text(data.alerts);
		$('.users-stats .push span').text(data.push);
		$('.users-stats .mobileApp span').text(data.mobiles);
		
		userList = [];
		// Transforming data from the server to an array of user id's
		Object.keys(data.userInfo).forEach(function(registration) {
			data.userInfo[registration].forEach(function(user) {
				if(userList.indexOf(user.userID) < 0 && user.userID){
					userList.push(user.userID);
				}
			})
		});
		var userListChanged = false;
		
		if(userList.length === oldList.length){
			userList.every(function(user) {
				if(oldList.indexOf(user) === -1) {
					userListChanged = true;
					return false;
				}
				return 1;
			})
		}else{
			userListChanged = true;
		}

		if(userListChanged){
			oldList = [];
			userList.forEach(function(user) {
				oldList.concat([user]);
			})
	        // emit new array
			userList$.onNext(userList);
		}
 
	}

	function initializeUserIdFilter() {
		var inputForm = document.querySelector('#user-id-filter');
		// Create stream from input event
		if(inputForm){
			userFilter$ = Rx.Observable
				.fromEvent(inputForm, 'input')
				// get input values
			  	.map(e => e.currentTarget.value)
			  	// Emmit values with at least 200ms break
			  	.debounce(200)
			  	// Initial value
			  	.startWith('');

			// Combine two streams by taking the last values from both, returning the stream of filtered user id values  	
			filteredUserList$ = Rx.Observable.combineLatest(userList$, userFilter$, (userList, filter) => {
			 	if(filter === '') return userList;
			  	return userList.filter(user => user.indexOf(filter) === 0);
			});
			// Subscribe to the filtered user list values -> and update UI
			filteredUserList$.subscribe(e => {
				updateUserListDisplay(e);
			});
			
		}
	}
	
	function updateUserListDisplay(e) {

		userListContainer.html('');

		var userListContent = '';
		e.forEach(function(userID) {
			userListContent += '<div class="user-id-holder"><span class="user-id-value">'+ userID +'</span><i data-userID="' + userID + '" class="fa fa-plus-circle user-id-button"></i></div>';
		});
		userListContainer.html(userListContent);
		
	};

	function selectUser(e) {
		var userID = $(this).attr('data-userID');
		if(selectedUsers.indexOf(userID) === -1){
			selectedUsers.push(userID);
			selectedUserListContainer.append('<div id="'+ userID +'-holder" class="user-id-holder"><span class="user-id-value">'+ userID +'</span><i id="'+ userID +'-remove-button" data-userID="' + userID + '" class="fa fa-times-circle "></i></div>');
			$('#' + userID +'-remove-button').on('click', function() {
				$(this).off();

				selectedUsers = selectedUsers.filter(function(id) {
					return id !== userID;
				});
				$('#' + userID + '-holder').remove();
			})
		}
	}

	function registerPushNotifications() {
		var config = {
		    apiKey: "AIzaSyCYVLNyZ707vfakmcv9Yxouu955O2cisgk",
		    messagingSenderId: "454419618716"
		};
		
  		firebase.initializeApp(config);
		
		var messaging = firebase.messaging();

		messaging.onTokenRefresh(function() {
			messaging.getToken()
			  	.then(function(refreshedToken) {
				    console.log('Market Notifications Admin: Token refreshed.');
				  })
			  	.catch(function(err) {
			    	console.log('Market Notifications Admin: Unable to retrieve refreshed token ', err);
			    });
		});

		
	  	navigator.serviceWorker
			.register('scripts/firebase-messaging-sw.js')
			.then(function(registration) {
				return messaging.useServiceWorker(registration);
			})
			.then(function() {
				console.log('Market Notifications Admin: Service worker registered');
				return messaging.requestPermission()
			})
			.then(function() {
				return messaging.getToken();
			})
			.then(function(currentToken) {
				var adminData = {};
	            adminData.token = currentToken;
				events.publish(eventNames.admin._PUSH_REGISTER_, adminData);
			})
			.catch(function(err) {
				console.log('Market Notifications Admin: Push registration error: ' + err);
			})			

	}
	// array of currently visible notifications
	var visibleNotifications = [];

	// Backlog if too many alerts
	var notificationsBacklog = [];

	var alertDuration = 300000;



	// Defines layout or market alerts
	function setAlertOptions() {
		// > 991
		var result = {
			limit: 5,
			animate: {
				enter: 'animated fadeInRightBig',
				exit: 'animated flipOutX'
			},
			placement: {
				from: 'top',
				align: 'right'
			}
		}
		// < 992
		/*if (display.withinRange(0, 991)) {
			result = {
				limit: 3,
				animate: {
					enter: 'animated fadeInUp',
					exit: 'animated flipOutX'
				},
				placement: {
					from: 'bottom',
					align: 'center'
				}
			}
		}*/
		return result;
	};

	function showPersonalMessage(data) {
		var options = setAlertOptions();
		var message = data.message;
		var url = data.url;
		var title = data.title;
		//var type = 'client-notifications';
		var clientMessageTemplate = '<div data-notify="container" id="notification-container" class="col-xs-11 col-sm-8 col-md-5 col-lg-3 alert alert-{0} client-notifications" role="alert">' +
						'<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
						'<div class="time-logo-container">' + 
							'<div class="logo-container"></div>' +
							'<div class="time-container">'+ data.messageTime +'</div>' +
						'</div>' + 	
						'<div class="message-container">' + 
							 message  +
						'</div>';
					'</div>';

		var notification = $.notify(
			{
				title: title,
				message: message,
			},
			$.extend(
				options,
				{
					type: 'minimalist',
					delay: alertDuration,
					allow_dismiss: true,
					newest_on_top: true,
					template: clientMessageTemplate,
					onShown: function(){
						// Handle click event
						$(notification.$ele[0]).off('click.ClientMessage').on('click.ClientMessage', function(e) {
							e.stopPropagation();
							if(e.currentTarget === this){
								// Notification clicked
								//location.href = url;
								window.open(url);
							}
						});
					},
					onClose: function(){
						$(notification.$ele[0]).off('click.ClientMessage');
						$(notification.$ele[0]).find('.close').off('click.ClientMessage');
						// Check backlog
						if (notificationsBacklog.length > 0) {
							if(notificationsBacklog[0].alertType === 'market alert'){
								marketNotification(notificationsBacklog[0], setAlertOptions());
							}
							if(notificationsBacklog[0].alertType === 'client message'){
								showPersonalMessage(notificationsBacklog[0]);
							}
							
							notificationsBacklog.shift();
						}
					},
				}
			)
		);
	};

	events.subscribe(eventNames.messages._ALERT_PREVIEW_, function(msg){
		msg.notificationID = '123';
		msg.alertType = 'client message';
		var options = setAlertOptions();
		// Add to backlog if too many shown
		if ($('div[data-notify]').length >= options.limit) {
			// Push to backlog
			notificationsBacklog.push(msg);
		} else {
			// Show notification
			showPersonalMessage(msg);	
		}
	});
})();