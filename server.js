"use strict";

const express = require('express');
const app = express();
const http = require('http').Server(app);
const colors = require('colors');

const config = require('./config');

const marketAlerts = require('./lib/marketAlerts');


http.listen(config.port, () => {
	console.log(`Server listening on port ${config.port}`.magenta.bold.bgWhite);
})