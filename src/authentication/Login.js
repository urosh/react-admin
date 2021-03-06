import React,  {Component} from 'react';
import './Login.css';
/*
 * Login presentational component. 

 */
const Login = (props) => {
	let userName;
	let password;
	return (
		<div className="content">
		    <div id="login-form-holder" className="login-form">
		        <div className="header">
		        	<div id="logo-container" className="logo-container">
		        		<div className="logo-holder holder">
				            <img src={require('../img/logo_32.png')}/>
		        		</div>
		        		<div className="text-holder holder">
		        			<div className="top-text"><span className="left-text">market</span><span className="right-text">Notifications</span></div>
		                </div>
		        	</div>
		        </div>
		        <div className="form-holder">
		           <div className={"login-error error " + (props.errorLogin ? 'has-error' : '')}>
				    	<span className="login-error-content error-content">{props.errorMessage}</span>
				    </div>
		        	<form autoComplete="off">
		                <div className="form-group username-group">
		                    <div className="input-group">
		                        <div className="input-group-addon"><i className="fa fa-user"></i></div>
		                        <input ref={(input) => {userName = input;}} type="text" className="form-control" id="username" placeholder="Username"/>
		                    </div>
		                </div>
		                <div className="form-group password-group">
		                	<div className="input-group">
		                        <div className="input-group-addon"><i className="fa fa-lock"></i></div>
		                        <input ref={(input) => {password = input; }} type="password" className="form-control" id="password" placeholder="Password"/>
		                    </div>
		                </div>
		                <div className="login-btn-group btn-group">
			                <a href="#" className="login-btn btn" onClick={() => {
			                	props.onLogin(userName.value, password.value)
			                }}>Log In</a>
		                </div>
		            </form>
		        </div>
		    </div>
		    <div id="dashboard-content" className="dashboard-content"></div>
		</div>
	)
}

Login.propTypes = {
	errorLogin: React.PropTypes.bool,
	errorMessage: React.PropTypes.string
}
export default Login;