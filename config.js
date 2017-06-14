"use strict";

const port = 3031;

const socketOrigins = 'www.easymarkets.com:* chn.easymarkets.com:* prp.easymarkets.com:* prpchn.easymarkets.com:* lcl.easymarkets.com:* lcl.lb.com:* pushprp.easymarkets.com:* notify.easymarkets.com:*';

const eventChannels = {
	_SOCKETS_ : 'sockets',
	_ROUTES_ : 'routes'
};

const mssqlHost = 'mssql://' + process.env.MSSQL_USER + ':' + process.env.MSSQL_PASS + '@' + process.env.MSSQL_IP + ':' + process.env.MSSQL_PORT + '/EZFX_MC';

const mssql = {
	host: mssqlHost
};

const db = {
	name: 'marketNotifications',
	connection: 'mongodb://localhost:27017/'
};

const globalPairs = [
	'EUR/USD',
	'USD/CHF', 
	'USD/JPY',
	'GBP/USD',
	'XAU/USD',
	'AUD/USD', 
	'XAG/USD', 
	'OIL/USD',
	'BRT/USD',
	'DAX/EUR',
	'FTS/GBP',
	'NDQ/USD',
	'DOW/USD',
	'USD/CAD',
	'EUR/JPY',
	'GBP/JPY',
	'NZD/USD',
	'EUR/GBP',
	'AUD/JPY',
	'USX/USD',
	'CAC/EUR',
	'NKI/USD',
	'USD/CNH',
	'NZD/JPY',
	'ASX/AUD'
];

const sentinels = [
	{ host: 'localhost', port: 26379 }
];

module.exports = {
	port,
	socketOrigins,
	eventChannels,
	mssql,
	db,
	globalPairs,
	sentinels
};
