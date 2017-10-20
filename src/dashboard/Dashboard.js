import React, { Component } from 'react';
import { Router, Route, IndexRoute } from 'react-router';
import PanelMenuContainer from './PanelMenuContainer';

const Dashboard  = (props) =>  {
	
	return (
		<div className="dashboard">
			<PanelMenuContainer />	       
	    	<div className="dashboard-content"> 
	    		{props.children} 
	    	</div>
	    </div>
	)
}


export default Dashboard;
