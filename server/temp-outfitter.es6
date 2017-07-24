'use strict';

let ApplicationFile = require('./models/application-files.es6');
let AWS = require('aws-sdk');
let fs = require('fs');
let multer = require('multer');
let multerS3 = require('multer-s3');
let request = require('request');
let TempOutfitterApplication = require('./models/tempoutfitter-application.es6');
let util = require('./util.es6');
let validator = require('./validation.es6');
let vcapServices = require('./vcap-services.es6');

let tempOutfitter = {};

let translateFromClientToDatabase = input => {
  return {
    applicantInfoDayPhoneAreaCode: input.applicantInfo.dayPhone.areaCode,
    applicantInfoDayPhoneExtension: input.applicantInfo.dayPhone.extension,
    applicantInfoDayPhoneNumber: input.applicantInfo.dayPhone.number,
    applicantInfoDayPhonePrefix: input.applicantInfo.dayPhone.prefix,
    applicantInfoEmailAddress: input.applicantInfo.emailAddress,
    applicantInfoEveningPhoneAreaCode: input.applicantInfo.eveningPhone
      ? input.applicantInfo.eveningPhone.areaCode
      : null,
    applicantInfoEveningPhoneExtension: input.applicantInfo.eveningPhone
      ? input.applicantInfo.eveningPhone.extension
      : null,
    applicantInfoEveningPhoneNumber: input.applicantInfo.eveningPhone ? input.applicantInfo.eveningPhone.number : null,
    applicantInfoEveningPhonePrefix: input.applicantInfo.eveningPhone ? input.applicantInfo.eveningPhone.prefix : null,
    applicantInfoFaxAreaCode: input.applicantInfo.fax ? input.applicantInfo.fax.areaCode : null,
    applicantInfoFaxExtension: input.applicantInfo.fax ? input.applicantInfo.fax.extension : null,
    applicantInfoFaxNumber: input.applicantInfo.fax ? input.applicantInfo.fax.number : null,
    applicantInfoFaxPrefix: input.applicantInfo.fax ? input.applicantInfo.fax.prefix : null,
    applicantInfoOrganizationName: input.applicantInfo.organizationName,
    applicantInfoOrgType: input.applicantInfo.orgType,
    applicantInfoPrimaryFirstName: input.applicantInfo.primaryFirstName,
    applicantInfoPrimaryLastName: input.applicantInfo.primaryLastName,
    applicantInfoPrimaryMailingAddress: input.applicantInfo.primaryAddress.mailingAddress,
    applicantInfoPrimaryMailingAddress2: input.applicantInfo.primaryAddress.mailingAddress2,
    applicantInfoPrimaryMailingCity: input.applicantInfo.primaryAddress.mailingCity,
    applicantInfoPrimaryMailingState: input.applicantInfo.primaryAddress.mailingState,
    applicantInfoPrimaryMailingZIP: input.applicantInfo.primaryAddress.mailingZIP,
    applicantInfoWebsite: input.applicantInfo.website,
    authorizingOfficerName: input.authorizingOfficerName,
    authorizingOfficerTitle: input.authorizingOfficerTitle,
    district: input.district,
    forest: input.forest,
    reasonForReturn: input.reasonForReturn,
    region: input.region,
    signature: input.signature,
    tempOutfitterFieldsActDescFieldsAudienceDesc:
      input.tempOutfitterFields.activityDescriptionFields.audienceDescription,
    tempOutfitterFieldsActDescFieldsDescCleanupRestoration:
      input.tempOutfitterFields.activityDescriptionFields.descriptionOfCleanupAndRestoration,
    tempOutfitterFieldsActDescFieldsEndDateTime:
      input.tempOutfitterFields.activityDescriptionFields.dateTimeRange.endDateTime,
    tempOutfitterFieldsActDescFieldsListGovFacilities:
      input.tempOutfitterFields.activityDescriptionFields.listOfGovernmentFacilities,
    tempOutfitterFieldsActDescFieldsListTempImprovements:
      input.tempOutfitterFields.activityDescriptionFields.listOfTemporaryImprovements,
    tempOutfitterFieldsActDescFieldsLocationDesc:
      input.tempOutfitterFields.activityDescriptionFields.locationDescription,
    tempOutfitterFieldsActDescFieldsNumServiceDaysReq:
      input.tempOutfitterFields.activityDescriptionFields.numberServiceDaysRequested,
    tempOutfitterFieldsActDescFieldsNumTrips: input.tempOutfitterFields.activityDescriptionFields.numberOfTrips,
    tempOutfitterFieldsActDescFieldsServProvided: input.tempOutfitterFields.activityDescriptionFields.servicesProvided,
    tempOutfitterFieldsActDescFieldsStartDateTime:
      input.tempOutfitterFields.activityDescriptionFields.dateTimeRange.startDateTime,
    tempOutfitterFieldsActDescFieldsStmtAssignedSite:
      input.tempOutfitterFields.activityDescriptionFields.statementOfAssignedSite,
    tempOutfitterFieldsActDescFieldsStmtMotorizedEquip:
      input.tempOutfitterFields.activityDescriptionFields.statementOfMotorizedEquipment,
    tempOutfitterFieldsActDescFieldsStmtTransportLivestock:
      input.tempOutfitterFields.activityDescriptionFields.statementOfTransportationOfLivestock,
    tempOutfitterFieldsAdvertisingDescription: input.tempOutfitterFields.advertisingDescription,
    tempOutfitterFieldsAdvertisingUrl: input.tempOutfitterFields.advertisingURL,
    tempOutfitterFieldsClientCharges: input.tempOutfitterFields.clientCharges,
    tempOutfitterFieldsExperienceList: input.tempOutfitterFields.experienceList,
    tempOutfitterFieldsIndividualCitizen: input.tempOutfitterFields.individualIsCitizen,
    tempOutfitterFieldsSmallBusiness: input.tempOutfitterFields.smallBusiness,
    type: input.type,
    tempOutfitterFieldsActDescFieldsPartySize: input.tempOutfitterFields.activityDescriptionFields.partySize,
    tempOutfitterFieldsExpAllCitations: input.tempOutfitterFields.experienceFields.listAllCitations,
    tempOutfitterFieldsExpNatForestPermits: input.tempOutfitterFields.experienceFields.listAllNationalForestPermits,
    tempOutfitterFieldsExpOtherPermits: input.tempOutfitterFields.experienceFields.listAllOtherPermits
  };
};

let translateFromDatabaseToClient = input => {
  return {
    appControlNumber: input.appControlNumber,
    applicationId: input.applicationId,
    authorizingOfficerName: input.authorizingOfficerName,
    authorizingOfficerTitle: input.authorizingOfficerTitle,
    createdAt: input.createdAt,
    district: input.district,
    forest: input.forest,
    reasonForReturn: input.reasonForReturn || undefined,
    region: input.region,
    signature: input.signature,
    status: input.status,
    type: input.type,
    applicantInfo: {
      emailAddress: input.applicantInfoEmailAddress,
      primaryFirstName: input.applicantInfoPrimaryFirstName,
      primaryLastName: input.applicantInfoPrimaryLastName,
      primaryAddress: {
        mailingAddress: input.applicantInfoPrimaryMailingAddress,
        mailingAddress2: input.applicantInfoPrimaryMailingAddress2,
        mailingCity: input.applicantInfoPrimaryMailingCity,
        mailingState: input.applicantInfoPrimaryMailingState,
        mailingZIP: input.applicantInfoPrimaryMailingZIP
      },
      website: input.applicantInfoWebsite,
      organizationName: input.applicantInfoOrganizationName,
      orgType: input.applicantInfoOrgType,
      dayPhone: {
        areaCode: input.applicantInfoDayPhoneAreaCode,
        extension: input.applicantInfoDayPhoneExtension || undefined,
        number: input.applicantInfoDayPhoneNumber,
        prefix: input.applicantInfoDayPhonePrefix
      },
      eveningPhone: {
        areaCode: input.applicantInfoEveningPhoneAreaCode || undefined,
        extension: input.applicantInfoEveningPhoneExtension || undefined,
        number: input.applicantInfoEveningPhoneNumber || undefined,
        prefix: input.applicantInfoEveningPhonePrefix || undefined
      },
      fax: {
        areaCode: input.applicantInfoFaxAreaCode || undefined,
        extension: input.applicantInfoFaxExtension || undefined,
        number: input.applicantInfoFaxNumber || undefined,
        prefix: input.applicantInfoFaxPrefix || undefined
      }
    },
    tempOutfitterFields: {
      advertisingDescription: input.tempOutfitterFieldsAdvertisingDescription,
      advertisingURL: input.tempOutfitterFieldsAdvertisingUrl,
      clientCharges: input.tempOutfitterFieldsClientCharges,
      experienceList: input.tempOutfitterFieldsExperienceList,
      individualIsCitizen: input.tempOutfitterFieldsIndividualCitizen,
      smallBusiness: input.tempOutfitterFieldsSmallBusiness,
      activityDescriptionFields: {
        audienceDescription: input.tempOutfitterFieldsActDescFieldsAudienceDesc,
        descriptionOfCleanupAndRestoration: input.tempOutfitterFieldsActDescFieldsDescCleanupRestoration,
        haveLivestock: !!input.tempOutfitterFieldsActDescFieldsStmtTransportLivestock,
        haveMotorizedEquipment: !!input.tempOutfitterFieldsActDescFieldsStmtMotorizedEquip,
        listOfGovernmentFacilities: input.tempOutfitterFieldsActDescFieldsListGovFacilities,
        listOfTemporaryImprovements: input.tempOutfitterFieldsActDescFieldsListTempImprovements,
        locationDescription: input.tempOutfitterFieldsActDescFieldsLocationDesc,
        needAssignedSite: !!input.tempOutfitterFieldsActDescFieldsStmtAssignedSite,
        needGovernmentFacilities: !!input.tempOutfitterFieldsActDescFieldsListGovFacilities,
        needTemporaryImprovements: !!input.tempOutfitterFieldsActDescFieldsListTempImprovements,
        numberOfTrips: input.tempOutfitterFieldsActDescFieldsNumTrips,
        numberServiceDaysRequested: input.tempOutfitterFieldsActDescFieldsNumServiceDaysReq,
        partySize: input.tempOutfitterFieldsActDescFieldsPartySize,
        servicesProvided: input.tempOutfitterFieldsActDescFieldsServProvided,
        statementOfAssignedSite: input.tempOutfitterFieldsActDescFieldsStmtAssignedSite,
        statementOfMotorizedEquipment: input.tempOutfitterFieldsActDescFieldsStmtMotorizedEquip,
        statementOfTransportationOfLivestock: input.tempOutfitterFieldsActDescFieldsStmtTransportLivestock,
        dateTimeRange: {
          endDateTime: input.tempOutfitterFieldsActDescFieldsEndDateTime,
          startDateTime: input.tempOutfitterFieldsActDescFieldsStartDateTime
        }
      },
      experienceFields: {
        haveCitations:
          input.tempOutfitterFieldsExpAllCitations !== undefined && input.tempOutfitterFieldsExpAllCitations.length > 0
            ? true
            : false,
        haveNationalForestPermits:
          input.tempOutfitterFieldsExpNatForestPermits !== undefined &&
          input.tempOutfitterFieldsExpNatForestPermits.length > 0
            ? true
            : false,
        haveOtherPermits:
          input.tempOutfitterFieldsExpOtherPermits !== undefined && input.tempOutfitterFieldsExpOtherPermits.length > 0
            ? true
            : false,
        listAllCitations: input.tempOutfitterFieldsExpAllCitations,
        listAllNationalForestPermits: input.tempOutfitterFieldsExpNatForestPermits,
        listAllOtherPermits: input.tempOutfitterFieldsExpOtherPermits
      }
    }
  };
};

let translateFromIntakeToMiddleLayer = input => {
  console.log(input);
  let result = {
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

  return result;
};

let acceptTempOutfitterPermitApplication = application => {
  let requestOptions = {
    url: vcapServices.middleLayerBaseUrl + 'permits/applications/special-uses/commercial/temp-outfitters/',
    headers: {},
    formData: {
      body: JSON.stringify(translateFromIntakeToMiddleLayer(application)),
      guideDocumentation: fs.createReadStream('./test.pdf'),
      acknowledgementOfRiskForm: fs.createReadStream('./test.pdf'),
      insuranceCertificate: fs.createReadStream('./test.pdf'),
      goodStandingEvidence: fs.createReadStream('./test.pdf'),
      operatingPlan: fs.createReadStream('./test.pdf')
    }
  };

  return new Promise((resolve, reject) => {
    util
      .authenticateMiddleLayer()
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

// S3 Setup

// Upload to S3
let s3 = new AWS.S3({
  accessKeyId: vcapServices.accessKeyId,
  secretAccessKey: vcapServices.secretAccessKey,
  region: vcapServices.region
});

tempOutfitter.streamToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: vcapServices.bucket,
    key: function(req, file, next) {
      next(null, file.originalname); //use Date.now() for unique file keys
    }
  })
});

tempOutfitter.attachFile = (req, res) => {
  ApplicationFile.create({
    applicationId: req.body.applicationId,
    // applicationType: req.body.applicationType,
    // s3FileName: req.body.s3FileName,
    // originalFileName: req.body.originalFileName
    applicationType: 'tempoutfitters',
    s3FileName: 'test.pdf',
    originalFileName: 'originalTest.pdf'
  })
    .then(appfile => {
      req.body['fileId'] = appfile.fileId;
      res.status(201).json(req.body);
    })
    .error(err => {
      res.status(500).json(err);
    });
};

tempOutfitter.create = (req, res) => {
  let errorRet = {};
  let errorArr = validator.validateTempOutfitter(req.body);
  if (errorArr.length > 0) {
    errorRet['errors'] = errorArr;
    res.status(400).json(errorRet);
  } else {
    TempOutfitterApplication.create(translateFromClientToDatabase(req.body))
      .then(tempOutfitterApp => {
        req.body['applicationId'] = tempOutfitterApp.applicationId;
        req.body['appControlNumber'] = tempOutfitterApp.appControlNumber;
        res.status(201).json(req.body);
      })
      .catch(err => {
        res.status(500).json(err);
      });
  }
};

tempOutfitter.getOne = (req, res) => {
  TempOutfitterApplication.findOne({ where: { app_control_number: req.params.id } })
    .then(app => {
      if (app) {
        res.status(200).json(translateFromDatabaseToClient(app));
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      res.status(500).json(error.message);
    });
};

tempOutfitter.update = (req, res) => {
  TempOutfitterApplication.findOne({ where: { app_control_number: req.params.id } }).then(application => {
    if (application) {
      application.status = req.body.status;
      if (application.status === 'Accepted') {
        acceptTempOutfitterPermitApplication(application)
          .then(response => {
            application.controlNumber = response.controlNumber;
            application
              .save()
              .then(() => {
                res.status(200).json(translateFromDatabaseToClient(application));
              })
              .catch(error => {
                res.status(500).json(error);
              });
          })
          .catch(error => {
            res.status(500).json(error);
          });
      } else {
        application
          .save()
          .then(() => {
            res.status(200).json(translateFromDatabaseToClient(application));
          })
          .catch(error => {
            res.status(500).json(error);
          });
      }
    } else {
      res.status(404).send();
    }
  });
};

module.exports = tempOutfitter;
