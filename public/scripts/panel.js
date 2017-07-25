
var panelModule = (function() {
	
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
		panelInitialized = false,
		username,
		showAdminPanelModule

	function init(_showAdminPanelModule){
		showAdminPanelModule = _showAdminPanelModule;
		
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

	function showPanel(data, transition){
		username = data.username;
		if(transition){
			loginFormHolder.hide();
			panelContent.addClass('transition-start');
		}else{
			panelContent.addClass('active');
		}
		panelContent.show();
		userManagement.show();
        userManagement.find('.name-holder').text(username);
		header.addClass('panel-active');
		content.addClass('panel-active');
		$.ajax({
		    url: "templates/panel.html",
		    cache: false,
		    dataType: "html",
		    success: function(data) {
		    	panelContent.removeClass('transition-start');
		    	// Set panel data
			    panelContent.html(data);
			    var transitionDuration = transition ? 600 : 0;
		    	setTimeout(function(){
		    		if(typeof showAdminPanelModule === 'function'){
		    			showAdminPanelModule();
		    		}
				}, transitionDuration)
		        // Populate menu information
		        panelRow = $('.panel-row');
		        currentMenuItem = $(panelRow[0]).attr('data-panel');
		        $(panelRow[0]).addClass('active');
		        // Initialize content
		     

		    }
		});

	}

	return {
		init: init,
		showPanel: showPanel
	}

})();