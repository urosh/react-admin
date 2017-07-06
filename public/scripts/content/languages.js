(function(){

	var pushSubscription = events.subscribe(eventNames.languages._INIT_, function() {
		// Do something now that the event has occurred
	});

	var languages;

	var getLanguages = events.subscribe(eventNames.languages._GET_LANGUAGES_, function() {
		if(!languages) {
			$.getJSON("/api/fetch/languages").done(data => {
					languages = data;
					events.publish(eventNames.languages._SET_LANGUAGES_, languages );
				
			});
		}else{
			events.publish(eventNames.languages._SET_LANGUAGES_, languages );
		}
	});

		
})();