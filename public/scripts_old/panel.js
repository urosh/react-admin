/*
 * Admin panel module. Responsible for admin panel. It manages different modules by listening for 
 * specific events. 
 */

var panelModule = (function() {
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
		        		
		        	})
		        }, 600)
		        
		        // Handle user click on the menu
		        panelRow.click(function(e){

		        	panelRow.removeClass('active');
		        	$(e.currentTarget).addClass('active');
		        	// Update current menu item
		        	currentMenuItem = $(e.currentTarget).attr('data-panel');
					
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
	
	var logoContainer ,
		loginFormHolder,
		logoutButton,
		panelContent,
		panelContent,
		header,
		panelRow,
		content,
		currentMenuItem,
		menuMessages = [],
		userManagement,
		panelInitialized = false;

	function init(){
		if(!panelInitialized){
			logoContainer = $('#logo-container');
			loginFormHolder = $('#login-form-holder');
			logoutButton = $('.logout-holder');
			panelContent = $('.form-holder');
			panelContent = $('#panel-content');
			header = $('.header');
			panelRow;
			content = $('.content');
			currentMenuItem;
			menuMessages = [];
			userManagement = $('#user-management');
			panelInitialized = true;
			
			$(document).on('click', '.logout-holder', function(){
				$.get('/admin/auth/logout', function(data){
	    			window.location.reload(true);
	    		})
			})
		}
	}

	function showPanel(data){
		username = user.username;
		showPanel();
	}

	function userLogin(data){
		username = data.username;
		console.log('we are doing great');
		//login();
	}

	return {
		init: init,
		showPanel: showPanel,
		userLogin: userLogin
	}

})();