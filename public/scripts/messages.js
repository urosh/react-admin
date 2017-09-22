var messagesModule = (function(){
	var sendMessageButton,
		previewMessageButton,
		dashboardContent,
		messageInputContainer,
		userListContainer,
		selectedUserListContainer,
		languages = [{
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
		],
		userList = [],
		selectedUsers = [],
		importedUsers = [],
		filtersMappings = {
			cultures: {
				'International': 'int',
				'All cultures': 'all',
				'EU culture': 'eu',
				'AU culture': 'au'
			},
			userType: {
				'All users': 'all',
				'Logged in': 'in',
				'Logged out': 'out'
			},
			deviceType: {
				'Alert': 'alert',
				'Browser': 'browser',
				'Browser Alert': 'browser-alert',
				'Browser Push': 'browser-push',
				'Mobile': 'mobile',
				'Push All': 'push-all',
				'All': 'all'
			},
			testUsers: {
				'All users': 'all',
				'Test users': 'test',
				'Non test users': 'non-test'
			}

		},
		filters = {
			cultures: filtersMappings.cultures['All cultures'], 
			userType: filtersMappings.userType['All users'],
			testUsers: filtersMappings.testUsers['All users'],
			deviceType: filtersMappings.deviceType['All'],
			selectedUsers: selectedUsers,
			importedUsers: importedUsers,
			alertActiveLanguages : [],
			pushActiveLanguages : [],
			mobileActiveLanguages: []
		},
		userSelection,
		userStats,
		inputs,
		username,
		modalContent,
		// User list stream. It emmits new value each time updated list of users is returned from the server
		userList$ = new Rx.Subject(),
		// Filter stream. Stream of user input values
		userFilter$,
		// Stream of filtered user list that
		filteredUserList$,
		oldList = [],
		// array of currently visible notifications
		visibleNotifications = [];

		// Backlog if too many alerts
		notificationsBacklog = [];

		alertDuration = 300000;
	

	
	function init(_username){
		dashboardContent = $('#dashboard-content');
		dashboardContent.empty();
		username = _username;
		$.ajax({
		    url: "templates/messages/messages.html",
		    cache: false,
		    dataType: "html",
		    success: function(data) {
		    	// Set panel data
		    	dashboardContent.html(data);
		        
		        messageInputContent = $('.messages-input-holder .row');
		        
		        userListContainer = $('.user-list-container');
		        userListContainer.on('click', '.user-id-button', selectUser);
		        selectedUserListContainer = $('.selected-user-list-container');
		        
		        $('.selectpicker').selectpicker({
		  			size: 4
				});

				selectedUsers = [];
				importedUsers = [];
				addFilterChangeHandlers();
				userSelection = $('.messages-filter-holder');
		  		userStats = userSelection.find('.user-stats')[0];

				sendMessageButton = $('.message-btn');
				previewMessageButton = $('.message-preview-btn');
				modalContent = $('#adminModal .modal-content');
				addMessageInputs();
				sendMessageButton.off('click.send').on('click.send', sendMessage);
				previewMessageButton.off('click.preview').on('click.preview', previewMessage);
				$(document).on('click', '.modal-send-message-confirmation .confirm-btn', sendMessageConfirm);
				$(document).on('click', '.modal-confirmation-message .confirm-btn', function(){
					$("#adminModal").modal('hide');
				})
				$(document).on('click', '.modal-send-message-confirmation .cancel-btn', function(){
					$("#adminModal").modal('hide');
				})
				

				$('#csv-upload-button').on('click', function(e){
					e.preventDefault();
					var csv = $('#csv-file-select');
	        		var csvFile = csv[0].files[0];
	        		var ext = csv.val().split(".").pop().toLowerCase();

			        if($.inArray(ext, ["csv"]) === -1){
			            console.log('File format error');
			            return false;
			        }
			        var test = Papa.parse(csvFile, {
						delimiter: ",",
						complete: function(data){
							importedUsers = [];
							data.data.forEach(function(item,i){
								if(i > 0){
									if(item[0]){
										importedUsers.push(item[0]);
									}
								}
							})
							// Here i want to add stats about imported data
							$.ajax({
								type: "POST",
								url: '/api/fetch/csv/stats',
								data: JSON.stringify({users: importedUsers}),
								contentType: "application/json",
								success: function(res){
									console.log('Messages sent successfuly', res);
									
								},
								error: function(){
									console.log('There was a problem while sending the message');
								}
							});


							// /filters.importedUsers = importedUsers;
						}
					});
	
				})
				getRecipientStats();
		    }
		});
	}
	/**
	 * Prepare Message - called before sending the actual message. It shows the current message both alert
	 * and push notificiation on the admin page.
	 * 
	 * @param void
	 * @return void
	 */
	function prepareMessage(){
		var message = {
			push: {
				title: {},
				text: {},
				action: {}
			},
			alert: {
				title: {},
				text: {},
				action: {}
			},
			mobile: {
				title: {},
				text: {},
				action: {}
			},
			adminUsername: username,
			messageEmpty: true
		};

		// Transform UI states to filter values that server can understand
		message.filters = filters;
		
		filters.alertActiveLanguages.map(function(language) {
			
			var clearText = $($('#alert-message-' + language).summernote('code')).text();
			
			if(clearText !== '') message.messageEmpty = false;
			
			var htmlText = clearText === '' ? '' : $('#alert-message-' + language).summernote('code');
			
			message.alert.title[language] = 'Client Notification';
			
			message.alert.text[language] = htmlText;
			
			message.alert.action[language] = prepareMessageAction($('#alert-action-' + language).val());
		})
		
		filters.pushActiveLanguages.map(function(language){
			message.push.title[language] = $('#push-title-' + language).val();
			
			message.push.text[language] = $('#push-message-' + language).val();
			
			message.push.action[language] = prepareMessageAction($('#push-action-' + language).val());
					
		})

		if(filters.pushActiveLanguages){
			message.messageEmpty = false;
		}

		filters.mobileActiveLanguages.map(function(language){
			message.mobile.title[language] = $('#mobile-title-' + language).val();
			
			message.mobile.text[language] = $('#mobile-message-' + language).val();
			
			message.mobile.action[language] = $('#mobile-action-' + language ).val();

		})
		
		if(filters.mobileActiveLanguages){
			message.messageEmpty = false;
		}
		return message;
	}
	
	/**
	 * Prepeare actions format. Format for push and socket is a bit different. Also we currently dont know 
	 * what to expect from users since there's no instruction or constraint available for the action field. 
	 * So we need to take into consideration various possibilities and send proper action format to the client. 
	 *
	 * @params String action - action input from user
	 * @returns String - formated action string that is ready to go to client
	 */
	function prepareMessageAction(action){
		var result = '';
		if(!action) return result;
		if(action.indexOf('http') > -1) return action;
		result = action.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
		result = '/' + result;
		return result;
	}


	function sendMessage() {
		var message = prepareMessage();
		modalContent.empty();
		
		if(message.messageEmpty) {
			modalContent.append(
				'<p>Message fields are empty. Please add some text before sending the message. </p>' + 
				'<div class="modal-confirmation-message">' + 
					'<a href="#" class="btn confirm-btn">Ok</a>' + 
				'</div>'
			);
			
		}else{
			modalContent.append(
				'<div class="modal-send-message-confirmation">' + 
					'<p>Are you sure you want to send these messages to clients?</p>' + 
					'<div class="modal-confirmation-buttons-holder">' + 
						'<a href="#" class="btn confirm-btn">Ok</a>' + 
						'<a href="#" class="btn cancel-btn">Cancel</a>' + 
					'</div>' + 
				'</div>'
			);
		}
		$("#adminModal").modal('show');
		// I need the sreen height and the modal height
		var windowHeight = $(window).height();
		setTimeout(function(){
			var modalHeight = $(modalContent).outerHeight();
			var marginTop = (windowHeight - modalHeight) / 2;
			modalContent.css({'margin-top': marginTop + 'px'});
		}, 150)

	}
	
	function messageSentConfirmation(){
		modalContent.empty();
		modalContent.append('<p>Message sent successfuly</p><div class="modal-confirmation-message"><a href="#" class="btn confirm-btn">Ok</a></div>');
		// After message is sent, remove the id's from filters
	}

	function sendMessageConfirm(){
		var message = prepareMessage();
		//When sending the message attach user id's to the filter object.
		message.filters.selectedUsers = selectedUsers.slice(0);
		message.filters.importedUsers = importedUsers.slice(0);
		// check received message
		events.publish(eventNames.messages.SEND, message);
		filters.selectedUsers = [];
		filters.importedUsers = [];
		
	}

	function previewMessage() {
		var message = prepareMessage();
		events.publish(eventNames.messages.SEND_PREVIEW, message);
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

	function selectUser(e){
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
	
	/*
	 * CSV Upload handler
	 */
	function csvUploadHandler(e) {
		console.log('We got our csv and are so happy');
	}
	// 
	function addMessageInputs(){
		languages.map(function(lang){
			return lang.code;
		})
		.map(function(language){
			$('#alert-message-' + language ).summernote({
				height: 120,
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

			$('#alert-message-' + language).on('summernote.change', function(we, contents, $editable) {
				//pushText = $('#push-message-' + lang.code).val();
				var clearText = $(contents).text();
				
				/*
				 * Handling active language filter
				 * 
				 * When filtering users we need to take into consideration what languages do we 
				 * send. If the language input is empty users with this language selected should 
				 * not receive the message
				 */
				if(clearText && filters.alertActiveLanguages.indexOf(language) === -1 ) {
					filters.alertActiveLanguages.push(language);
				}

				if(!clearText && filters.alertActiveLanguages.indexOf(language) > -1){
					filters.alertActiveLanguages.splice(filters.alertActiveLanguages.indexOf(language), 1);
				}

			});

			$('#push-message-' + language).on('change keydown paste input', function(){
				if($('#push-message-' + language).val() && filters.pushActiveLanguages.indexOf(language) === -1){
					filters.pushActiveLanguages.push(language);
				}
				if(!$('#push-message-' + language).val() && filters.pushActiveLanguages.indexOf(language) > -1){
					console.log("Removing from push");
					filters.pushActiveLanguages.splice(filters.pushActiveLanguages.indexOf(language), 1);
				}
			});

			$('#mobile-message-' + language).on('change keydown paste input', function(){
				if($('#mobile-message-' + language).val() && filters.mobileActiveLanguages.indexOf(language) === -1){
					filters.mobileActiveLanguages.push(language);
				}
				if(!$('#mobile-message-' + language).val() && filters.mobileActiveLanguages.indexOf(language) > -1){
					filters.mobileActiveLanguages.splice(filters.mobileActiveLanguages.indexOf(language), 1);
				}
			});



			$('.note-current-color-button').hide();
			$('.note-color .note-icon-caret').addClass('note-icon-font');
			$('.note-color .note-icon-caret').css('color', 'brown');
			
			$('.note-current-color-button').off('click');
			$('.note-current-color').off('click');
		
		})
    	
		initializeUserIdFilter();
	}


	function addFilterChangeHandlers(){
		// When modifying filters, we want to update recipient stats straight away 
		$('.selectpicker.cultures').change(function(e){
			var selectedCulture = $(e.currentTarget).find("option:selected").text();
			filters.cultures = filtersMappings.cultures[selectedCulture];
			getRecipientStats();
		});
		$('.selectpicker.users').change(function(e){
			var selectedUsersType = $(e.currentTarget).find("option:selected").text();
			filters.userType = filtersMappings.userType[selectedUsersType];
			getRecipientStats();
		});
		$('.selectpicker.alert').change(function(e){
			var selectedDeviceType = $(e.currentTarget).find("option:selected").text();
			filters.deviceType = filtersMappings.deviceType[selectedDeviceType];
			getRecipientStats();
		});
		$('.selectpicker.test-users').change(function(e){
			var selectedTestUsers = $(e.currentTarget).find("option:selected").text();
			filters.testUsers = filtersMappings.testUsers[selectedTestUsers];
			getRecipientStats();
		});

		filters.importedUsers = importedUsers;
	}
	
	
	function getRecipientStats(){
		events.publish(eventNames.recipientStats._REQUEST_, filters);
	}


	function updateUserStats(data){
		//console.log(data);
		if(data){
			$('.users-stats .activeUsers span').text(data.totalUsers);
			$('.users-stats .loggedInUsers span').text(data.loggedInUsers);
			$('.users-stats .loggedOutUsers span').text(data.loggedOutUsers);
			$('.users-stats .mobileAppUsers span').text(data.mobileUsers);
		}
		getRecipientStats();
	}

	function updateReciptientStats(data){

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


	function messagePreview(data) {
		
		var options = {
			limit: 5,
			animate: {
				enter: 'animated fadeInRightBig',
				exit: 'animated flipOutX'
			},
			placement: {
				from: 'top',
				align: 'right'
			}
		};
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
							if(notificationsBacklog[0].alertType === 'client message'){
								messagePreview(notificationsBacklog[0]);
							}
							
							notificationsBacklog.shift();
						}
					},
				}
			)
		);
	};



	return {
		init: init,
		updateUserStats: updateUserStats,
		updateReciptientStats: updateReciptientStats,
		messageSentConfirmation: messageSentConfirmation,
		messagePreview: messagePreview
	}
})();