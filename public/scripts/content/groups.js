(function(){
	var groupsSubscription = events.subscribe(eventNames.groups._INIT_, function() {
		// Do something now that the event has occurred
		groupsInit();
	});
	

	var groupsInit = function() {
		console.log('We are in groups');
	}	
})();