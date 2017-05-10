"use strict";
const port = 3031;

const socketOrigins = 'www.easymarkets.com:* chn.easymarkets.com:* prp.easymarkets.com:* prpchn.easymarkets.com:* lcl.easymarkets.com:* lcl.lb.com:* pushprp.easymarkets.com:* notify.easymarkets.com:*';

const eventChannels = {
	_SOCKETS_ : 'sockets',
	_ROUTES_ : 'routes'
}


module.exports = {
	port,
	socketOrigins,
	eventChannels
};
