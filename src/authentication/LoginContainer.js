import React, { Component } from 'react';
import Login from './Login';
import { browserHistory } from 'react-router';

const transitionStageStates = {
	'_PENDING_' : '',
	'_INIT_': 'exit-init',
	'_ACTIVE_': 'exit-active',
	'_COMPLETE_': 'exit-complete'
};

class LoginContainer extends Component {
	constructor() {
		super();
		
		this.onLogin = this.onLogin.bind(this);
		this.formValidation = this.formValidation.bind(this);
		this.setErrorMessage = this.setErrorMessage.bind(this);
		
		this.state = {
			errorLogin: false,
			errorMessage: '',
			loginHidden: false,
			transitionStage: transitionStageStates._PENDING_,
		}
	}

	setErrorMessage(message) {
		if(message) {
			this.setState({
				errorMessage: message,
				errorLogin: true
			})
		}else{
			this.setState({
				errorMessage: '',
				errorLogin: false,
				loginHidden: true
			});
			this.runTransition()
			
		}
	}

	runTransition() {
		
		this.setState({transitionStage: transitionStageStates._ACTIVE_});
		
		setTimeout(() => {
			this.setState({transitionStage: transitionStageStates._COMPLETE_});
			
			browserHistory.push('/messages');
		}, 800)
	}

	onLogin(username, password) {
		if(this.formValidation(username, password)) {
			// send request to the server
			fetch('https://lcl.lb.com/admin/auth/login', {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: username,
					password: password
				})
			})
			.then(response => {
				if(response.status !== 200) {
					this.setErrorMessage( 'Username and password are not recognized');
				}else{
					this.setErrorMessage();
				}
			})
		}

	}

	formValidation(username, password) {
		console.log(`Validating login form for [username/password] [${username}/${password}]`);
		
		if(username === '' || password === '') {
			this.setErrorMessage( 'Username and password could not be empty');
			return false;
		}
		
		return true;
	}

	render() {
		return (
			<Login 
				onLogin={this.onLogin} 
				loginHidden={this.state.loginHidden} 
				errorLogin={this.state.errorLogin} 
				errorMessage={this.state.errorMessage}
				transitionStage={this.state.transitionStage}	
			/>
		);
	}
}

export default LoginContainer;