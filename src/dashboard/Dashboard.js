import React, { Component } from 'react';
import { Router, Route, IndexRoute } from 'react-router';

const Dashboard  = (props) =>  {
	
	return (
		<div className="App">
	        <div className="App-header">
	        	<h2>Market Notifications</h2>
	        </div>
	    	<div> {props.children} </div>
	    </div>
	)
}


export default Dashboard;
