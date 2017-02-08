import React, { Component } from 'react';
import Login from './Login';

class LoginContainer extends Component {
	constructor() {
		super();
		
		this.onLogin = this.onLogin.bind(this);
		this.formValidation = this.formValidation.bind(this);
		this.setErrorMessage = this.setErrorMessage.bind(this);
		
		this.state = {
			errorLogin: false,
			errorMessage: ''
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
				errorLogin: false
			})
		}
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
					this.setErrorMessage('Bravo');
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
		
		this.setErrorMessage();

		return true;
	}
	
	render() {
		return (
			<Login onLogin={this.onLogin} errorLogin={this.state.errorLogin} errorMessage={this.state.errorMessage}/>
		);
	}
}

export default LoginContainer;