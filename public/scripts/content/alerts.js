(function(){
	var alertsSubscription = events.subscribe(eventNames.alerts._INIT_, function() {
		// Do something now that the event has occurred
		alertsInit();
	});

	var alertsInit = function() {
		console.log('We are in alerts');
	}	
})();