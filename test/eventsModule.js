"use strict";

const expect = require('chai').expect;
const should = require('chai').should();
const assert = require('chai').assert;

const events = require('../lib/marketAlerts/events');

describe('Events module', function(){
	
		
	it('1. Checks getEvents function input', function() {
		events.getEvents('sck').length.should.equal(0);
		events.getEvents('sockets').length.should.equal(0);
		events.getEvents('routes').length.should.equal(0);
		events.getEvents().length.should.equal(0);
	});
	
	it('2. Checks addEvent inputs', function() {
		events.addEvent().should.equal(-1);
		events.addEvent('register', 'asasas').should.equal(-1);
		events.addEvent('register', 'asasas', 'dsds').should.equal(-1);
		events.addEvent('register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.addEvent().should.equal(-1);
		events.addEvent().should.equal(-1);
		events.addEvent().should.equal(-1);
	});
	
	it('3. Checks if event exists before adding', function() {
		events.reset();

		events.addEvent('register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.addEvent('register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.getEvents('sockets').length.should.equal(1);
		events.addEvent('push.register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.getEvents('sockets').length.should.equal(2);
	})

	it('4. Checks remove event logic', function() {
		events.reset();
		events.addEvent('register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.addEvent('push.register', 'sockets', [1, 2, 4], function(){}).should.be.a('string');
		events.removeEvent();
		events.getEvents('sockets').length.should.equal(2);
		events.removeEvent('dssd');
		events.getEvents('sockets').length.should.equal(2);
		events.removeEvent('register', 'wewweew');
		events.getEvents('sockets').length.should.equal(2);
		events.removeEvent('register', 'sockets');
		events.getEvents('sockets').length.should.equal(1);
		events.removeEvent('push.register', '232323');
		events.getEvents('sockets').length.should.equal(1);
		events.removeEvent('push.register', 'sockets');
		events.getEvents('sockets').length.should.equal(0);
	})
	
});
