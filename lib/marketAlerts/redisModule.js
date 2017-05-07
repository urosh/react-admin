var Redis = require('ioredis');
var config = require('../../config');
const userManagement = require('userManagement');

// Initialize redis
var Redis = require('ioredis');
var pub = new Redis({
    sentinels: config.sentinels,
    name: 'redis-cluster'
});
var sub = new Redis({
    sentinels: config.sentinels,
    name: 'redis-cluster'
});

sub.subscribe('push.register');

sub.on("message", (channel, message) => {
    var data = JSON.parse(message);
    if(userManagement[channel]) {
    	userManagement[channel].handle(data);
    }
}

