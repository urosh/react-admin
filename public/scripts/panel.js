/*
 * Admin panel module. Responsible for admin panel. It manages different modules by listening for 
 * specific events. 
 */
window.onload = (function() {
	// Wait for successfull login. Once this happen initialize panel. 
	var username;
	events.subscribe(eventNames.authentication._LOGIN_, function(user) {
		// Do something now that the event has occurred
		username = user.username;
		login();
	});
	events.subscribe(eventNames.admin.SHOW_PANEL, function(data){
		username = data.username;
		panelShow();
	})
	// Referencing dom elements
	var logoContainer = $('#logo-container');
	var loginFormHolder = $('#login-form-holder');
	var logoutButton = $('.logout-holder');
	var panelContent = $('.form-holder');
	var panelContent = $('#panel-content');
	var header = $('.header');
	var panelRow;
	var content = $('.content');
	var currentMenuItem;
	var menuMessages = [];
	var userManagement = $('#user-management');
	var panelMenuClicked = function(e) {

	}
	
	var login = function() {
		loginFormHolder.hide();
		panelContent.addClass('transition-start');
		panelContent.show();
		userManagement.find('.name-holder').text(username);
		userManagement.show();
		header.addClass('panel-active');
		content.addClass('panel-active');
		$.ajax({
		    url: "templates/panel.html",
		    cache: false,
		    dataType: "html",
		    success: function(data) {
		    	// Set panel data
		    	panelContent.removeClass('transition-start');
		        panelContent.html(data);

		        // Populate menu information
		        panelRow = $('.panel-row');
		        $(panelRow[0]).addClass('active');
		        // Initialize content
		        setTimeout(function(){
			        currentMenuItem = $(panelRow[0]).attr('data-panel');
			        events.publish(eventNames[currentMenuItem]._INIT_, {username: username});
		        	logoutButton.click(function(){
		        		$.get('/admin/auth/logout', function(data){
		        			window.location.reload(true);
		        		})
		        	})
		        }, 600)
		        
		        // Handle user click on the menu
		        panelRow.click(function(e){

		        	panelRow.removeClass('active');
		        	$(e.currentTarget).addClass('active');
		        	// Update current menu item
		        	currentMenuItem = $(e.currentTarget).attr('data-panel');
					
		        	// When menu item is clicked notify system to initialize selected admin module. 
		        	//events.publish(eventNames[currentMenuItem]._INIT_, {username: username});
		        	//events.publish('/content.' + currentMenuItem, null);
		        });
		    }
		});
	
	}
	
	
	var panelShow = function() {
		panelContent.show();
		header.addClass('panel-active');
		panelContent.addClass('active');
		content.addClass('panel-active');
		setTimeout(function(){
			//panelContent.load('templates/panel.html');
			$.ajax({
			    url: "templates/panel.html",
			    cache: false,
			    dataType: "html",
			    success: function(data) {
			    	// Set panel data
			        panelContent.html(data);
			        userManagement.find('.name-holder').text(username);
		
					userManagement.show();
			        // Populate menu information
			        panelRow = $('.panel-row');
			        currentMenuItem = $(panelRow[0]).attr('data-panel');
			        $(panelRow[0]).addClass('active');
			        // Initialize content
			        events.publish(eventNames[currentMenuItem]._INIT_, {username: username});

			        // Handle user click on the menu
			        panelRow.click(function(e){

			        	panelRow.removeClass('active');
			        	$(e.currentTarget).addClass('active');
			        	// Update current menu item
			        	currentMenuItem = $(e.currentTarget).attr('data-panel');
			
			        });
			    }
			});
		}, 500);
	}

})();