"use strict";

// Read .env file if found
require ('dotenv').config({siltent: true});

// Include newrelic if on production
if (process.env.ENVIRONMENT && process.env.ENVIRONMENT == 'production') {
	console.log('Adding NewRelic');
	require('newrelic');
}

const express = require('express');
const app = express();
const http = require('http').Server(app);
const colors = require('colors');
const bodyParser = require('body-parser');
const cors = require('cors');

const config = require('./config');

const marketAlerts = require('./lib/marketAlerts')(http);

app.use(bodyParser.json());
app.use(cors());


marketAlerts.init({
	socketOrigins: config.socketOrigins
})

http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})