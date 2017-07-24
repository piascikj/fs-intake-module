'use strict';

let fs = require('fs');
let request = require('request');
let util = require('./util.es6');
let vcapServices = require('./vcap-services.es6');

let middlelayerFacade = {};

let authenticate = () => {
  let requestOptions = {
    url: vcapServices.middleLayerBaseUrl + 'auth',
    json: true,
    body: { username: vcapServices.middleLayerUsername, password: vcapServices.middleLayerPassword }
  };
  return new Promise((resolve, reject) => {
    request.post(requestOptions, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        reject(error || response);
      } else {
        resolve(body.token);
      }
    });
  });
};

middlelayerFacade.acceptNoncommercialPermitApplication = application => {
  let requestOptions = {
    url: vcapServices.middleLayerBaseUrl + 'permits/applications/special-uses/noncommercial/',
    headers: {},
    json: true,
    body: util.translateFromIntakeToMiddleLayer(application)
  };
  return new Promise((resolve, reject) => {
    authenticate()
      .then(token => {
        requestOptions.headers['x-access-token'] = token;
        request.post(requestOptions, (error, response, body) => {
          if (error || response.statusCode !== 200) {
            reject(error || response);
          } else {
            resolve(body);
          }
        });
      })
      .catch(error => {
        reject(error);
      });
  });
};

let tempOutfitterApplication = {
  region: '11',
  forest: '11',
  district: '11',
  authorizingOfficerName: 'Khaleesi',
  authorizingOfficerTitle: 'Queen of Dragons',
  applicantInfo: {
    firstName: 'Grey',
    lastName: 'Worm',
    dayPhone: {
      areaCode: '321',
      number: '7654321',
      extension: '2345',
      phoneType: 'day'
    },
    eveningPhone: {
      areaCode: '123',
      number: '1234567',
      extension: '1234',
      phoneType: 'evening'
    },
    emailAddress: 'test@test.com',
    mailingAddress: '123 Easy Street',
    mailingAddress2: 'Apt 2',
    mailingCity: 'Evanston',
    mailingState: 'IL',
    mailingZIP: '60201',
    organizationName: 'My House',
    website: 'http://website.com',
    orgType: 'Association'
  },
  type: 'tempOutfitters',
  tempOutfitterFields: {
    individualIsCitizen: true,
    smallBusiness: true,
    activityDescription: 'Fun Activity',
    advertisingURL: 'http://advertising.com',
    advertisingDescription: 'Fun Advertising',
    clientCharges: 'Much value',
    experienceList: 'Such experience, wow!'
  }
};

middlelayerFacade.acceptTempOutfitterPermitApplication = () => {
  let requestOptions = {
    url: vcapServices.middleLayerBaseUrl + 'permits/applications/special-uses/commercial/temp-outfitters/',
    headers: {},
    formData: {
      body: JSON.stringify(tempOutfitterApplication),
      guideDocumentation: fs.createReadStream('./test.pdf'),
      acknowledgementOfRiskForm: fs.createReadStream('./test.pdf'),
      insuranceCertificate: fs.createReadStream('./test.pdf'),
      goodStandingEvidence: fs.createReadStream('./test.pdf'),
      operatingPlan: fs.createReadStream('./test.pdf')
    }
  };

  return new Promise((resolve, reject) => {
    authenticate()
      .then(token => {
        requestOptions.headers['x-access-token'] = token;
        request.post(requestOptions, (error, response, body) => {
          if (error || response.statusCode !== 200) {
            reject(error || response);
          } else {
            resolve(body);
          }
        });
      })
      .catch(error => {
        reject(error);
      });
  });
};

module.exports = middlelayerFacade;
