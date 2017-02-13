import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const App = ({children, location}) => {
  
    return (
    	<div>
	    	{ /*<ReactCSSTransitionGroup transitionName="login-dashboard"
		  			transitionEnterTimeout={200} transitionLeaveTimeout={800}>
		    		{React.cloneElement(children, { key: location.pathname })}
		    	</ReactCSSTransitionGroup> */
			children
		    }
    		
    	</div>
    );
  
}

export default App;
