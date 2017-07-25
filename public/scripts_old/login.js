/*
 * Admin authentication module. This is starting point of admin app. 
 * After users successfuly registers, admin panel is shown, and fun can start. 
 */
(function() {
	// Referencing dom elements
	var loginButton = $('.login-btn');
	var loginError = $('.login-error');
	var loginErrorContent = $('.login-error-content');
	var userName = $('#username');
	var password = $('#password');
	var loginContent = $('#login-form-holder');

	var panelShowSubscription = events.subscribe(eventNames.admin.SHOW_LOGIN, function(){
		loginContent.show();
		// This is for development purposes. If its here while merging it aint good. 
		/*setTimeout(function(){
			events.publish(eventNames.authentication._LOGIN_, {
				username: 'username'
			});
		}, 200);*/

	})

	var loginSuccessCallback = function(data) {
		// After successful login, notify rest of the admin system 
		events.publish(eventNames.authentication._LOGIN_, {
			username: userName.val()
		});
	};

	var loginErrorCallback = function(data) {
		loginErrorContent.text('Username and password are not recognized');
	  	loginError.css('visibility', 'visible');
	};

	

  	$('.login-btn').click(function(e) {
  		
  		if(userName.val() === '' && password.val() === ''){
  			loginErrorContent.text('Username and password could not be empty');
	  		loginError.css('visibility', 'visible');
  			return;
  		}
  		var userData = {
  			"username":   userName.val(),
			"password":  password.val()
  		}
  		
  		
  		$.ajax({
			type: "POST",
			url: '/admin/auth/login',
			data: JSON.stringify(userData),
			dataType: 'text',
			contentType: "application/json",
			success: loginSuccessCallback,
			error: loginErrorCallback
		});

  	});
})();
