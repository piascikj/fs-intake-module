'use strict';

var request = require('supertest');
var server = require('../app.es6');
var testGetURL = '/permits/applications';

describe('misc server tests', () => {
  it('should successfully send an OPTIONS request', done => {
    request(server).options(testGetURL).set('origin', 'http://localhost:4200').expect(200, done);
  });

  it('should get the uptime', done => {
    request(server).get('/uptime').expect(/Uptime/, done);
  });
});
