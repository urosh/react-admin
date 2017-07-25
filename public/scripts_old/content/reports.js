(function(){
	var sources = {
		"triggers": {
			name: "triggers",
			url: "#",
			filters: ['machines', 'users', 'notifications', 'date', 'instrument', 'message type' ],
			active: false
		},
		"machines": {
			name: "machines",
			url: "https://notify.easymarkets.com/tracking/api/machines",
			filters: ['triggers', 'users', 'notifications', 'date', 'instrument', 'message type' ],
			active: false
		},
		"users": {
			name: "users",
			url: "https://notify.easymarkets.com/tracking/api/users",
			filters: ['machines', 'triggers', 'notifications', 'date', 'instrument', 'message type' ],
			active: false
		},
		"notifications": {
			name: "notifications",
			url: "https://notify.easymarkets.com/tracking/api/notifications",
			filters: ['machines', 'users', 'triggers', 'date', 'instrument', 'message type' ],
			active: false
		}
	};
	
	var mainTemplate = null;
	var itemRecordTemplate = null;
	
	var mainTemplateRequest = $.ajax({
	    url: "templates/reports/index.html",
	    cache: false,
	    dataType: "html",
	});
	var itemRecordTemplateRequest = $.ajax({
	    url: "templates/reports/item-record.html",
	    cache: false,
	    dataType: "html",
	});

	/* Utility functions */


	function getActiveDataSource() {
		return Object.keys(sources).reduce(function(prev, next){
			if(prev) return prev;
  			if(sources[next].active) return sources[next].name;
  			return false; 
		}, false);
	}

	function getFilterList() {
		var list = [];
		Object.keys(sources).forEach(function(item) {
			sources[item].filters.forEach(function(filter) {
				if(list.indexOf(filter) === -1) {
					list.push(filter);
				}
			});
		});
		return list;
	}

	function checkFilterAvailablity(filter, src) {
		var availability = false;
		Object.keys(sources).forEach(function(item) {
			if(sources[item].name === src){
				if(sources[item].filters.indexOf(filter) > -1) {
					availability = true;
				}
			}
		});
		return availability; 
	}
	
	var dashboardContent = $('#dashboard-content');
	var exploreContent;
	var filterListContent;

	var reportsSubscription = events.subscribe(eventNames.reports._INIT_, function() {
		// Do something now that the event has occurred
		reportsInit();
	});
	
	var reportsInit = function() {
		
		$.when(mainTemplateRequest, itemRecordTemplateRequest).done(function(mainTemplateData, itemRecordData) {
			mainTemplate = mainTemplateData[0];
			itemRecordTemplate = itemRecordData[0];
			
			dashboardContent.empty();
        	dashboardContent.html(mainTemplate);

			setTimeout(function(){
				exploreContent = $('.explore-content .dashboard-items');
				filterListContent = $('.filter-list');
				setActiveSource('triggers');
				$('.facet-big').click(function(e){
	        		setActiveSource($(e.currentTarget).attr('data-source'));
	        	})
			}, 50);
		});
		
	}


	
	function setActiveSource(src) {
		if(src !== getActiveDataSource()) {
			
			Object.keys(sources).forEach(function(item){
				if(sources[item].name === 'src') {
					sources[item].active = true;
				}else{
					sources[item].active = false;
				}
			});

			$('.facet-big').removeClass('active');
			$('.facet-big').each(function(index, item){
				if($(this).attr('data-source') === src ) {
					$(this).addClass('active');
					updateContent(src);
				}
			})
		}
	}

	var start, end, step;
	start = 0;
	step = 40;
	var currentData = {};

	function updateContent(src) {
		// empty filter list 
		filterListContent.empty();
		var sourceData = sources[src];

		getFilterList().forEach(function(filter){
			if(checkFilterAvailablity(filter, src)){
				filterListContent.append('<span class="filter-name">'+ filter +'</span>');
			}else{
				filterListContent.append('<span class="filter-name disabled">'+ filter +'</span>');
			}
		});
		
		end = start + step;

		$.getJSON(sourceData.url).done(data => {
			console.log(data);
			currentData = data;
			for(i = start; i < end; i++){
				var item = itemRecordTemplate.replace(/%%message%%/g, currentData[i].data.message);
				item = item.replace(/%%date%%/g, currentData[i].data.eventDate);
				exploreContent.append(item);
			}
		});
	}

		
})();