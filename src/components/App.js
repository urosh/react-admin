import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const App = ({children, location}) => {
  
    return (
    	<div>
	    	<ReactCSSTransitionGroup transitionName="example"
	  			transitionEnterTimeout={1200} transitionLeaveTimeout={1200}>
	    		{React.cloneElement(children, { key: location.pathname })}
	    	</ReactCSSTransitionGroup>
    		
    	</div>
    );
  
}

export default App;
