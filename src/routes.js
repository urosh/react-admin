import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';

import Dashboard from './dashboard/Dashboard';
import Login from './authentication/Login';
import LoginContainer from './authentication/LoginContainer';
import Messages from './modules/Messages';
import Filters from './modules/Filters';
const checkLogin = () =>{
	console.log('Now we are entering');
}
const Routes = (props) => {
	return (
		<Router {...props} >
			<Route path="/" component={Dashboard} onEnter={checkLogin}>
				<Route path="/messages" component={Messages} />
				<Route path="/filters" component={Filters} />
			</Route>
			<Route path="/login" component={LoginContainer}/>
		</Router>
	)
}


export default Routes;
