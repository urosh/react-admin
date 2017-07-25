(function(){
	var rulesSubscription = events.subscribe(eventNames.rules._INIT_, function() {
		// Do something now that the event has occurred
		rulesInit();
	});

	var rulesInit = function() {
		console.log('We are in rules');
	}	
})();