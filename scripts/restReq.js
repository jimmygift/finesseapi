/*
  HTTP REST Requests from nodejs server to external Cisco AQM server
*/

var querystring = require('querystring'),
    request     = require('request'),
    fs          = require('fs'),
    nconf       = require('nconf'),
    utils       = require('./utils');

var TicketDataModel = require('../models/ticketData').model('ticketData'),
    CallDataModel   = require('../models/callData').model('callData'),
    logger          = require('./logger.js');


// Get config info
nconf.argv()
  .env()
  .file({ file: 'config/config.json' });

// Cisco AQM Server
var hostname    = nconf.get('ciscoAQMhost'),
    port        = nconf.get('ciscoAQMport'),
    username    = nconf.get('ciscoAQMuser'),
    password    = nconf.get('ciscoAQMpass'),
    baseUrl     = 'http://' + hostname + ':' + port,
    authUrl     = '/api/rest/authorize',
    contactUrl  = '/api/rest/recording/contact',
    contentType = 'application/json',
    authData    = [{
      id: "recording",
      userId: username,
      password: password
    }];


// HTTP Request Options
var authRequestOptions =
      // Authentication URL
      {
        method:  'POST',
        url:     baseUrl + authUrl,
        timeout: 5000,
        headers: {
          'Content-Type' : contentType
        },
        jar: true,
        body: JSON.stringify(authData)
      },
      // Contact Metadata
      contactMetadataRequestOptions =
      {
        method: 'PUT',
        url:    baseUrl + contactUrl,
        headers: {
                'Content-Type' : contentType
        },
        jar: true
      },
      // Contact data
      contactRequestOptions = {
        method : 'GET',

        url: baseUrl + contactUrl,
        jar: true
      };



// Authenticate to AQM Server
// Args:  cbkFunc       Callback function to call on completion
//        nextCall      Next function to call
exports.authenticate = function(cbkFunc, nextCall) {

  // Auth POST Request to AQM server
  request(authRequestOptions, function authRequestCbk(err,res,body){
    if (err) {
      // Error on HTTP request
      console.log(utils.status(520,err));
      cbkFunc(utils.status(520,err),null);
    } else if (res.statusCode == 401) {
      // 401 Unauthorized from AQM
      console.log(utils.status(521,err));
      cbkFunc(utils.status(521,err),null);
    } else if (res.statusCode == 200) {
      // Authentication to AQM successfull, proceed with requests
      nextCall(cbkFunc);
    };
  });
};

// Get last contacts (recorded call info) from AQM Server
// Args: params.extension   Extension  number
//       params.limit       Limit matching results
//       cbkFunc            Callback function to call on completion
exports.getLastContacts = function (params, cbkFunc){

  exports.authenticate(cbkFunc, function authenticationOk(cbkFunc){
    logger.log('getLastContacts. Sent request: ' + requestUrl);

    // Contact Info  GET Request
    var contactOptions = JSON.parse(JSON.stringify(contactRequestOptions)),
        defaultLimit   = 5,
        requestUrl     = contactOptions['url'] + '?' +
                         querystring.stringify({ number:  params.extension,
                                                 limit:   params.limit || defaultLimit });
    contactOptions['url'] =  requestUrl;

    request(contactOptions, function contactRequestCbk(err,res,body){
      if (err) {
        // Error on HTTP request
        console.log(utils.status(520,err));
        cbkFunc(utils.status(520,err), null);
      } else if (res.statusCode == 200 && JSON.parse(body).length != 0) {
        //utils.showResult(err,res,body);
        // filter results and send response
        var contacts = utils.filterObjects(JSON.parse(body),['id','startTime','callDuration','ani','dnis']);

        contacts = utils.duplicateProperty(contacts,'startTime','date');
        contacts = utils.duplicateProperty(contacts,'startTime','time');

        contacts = utils.modifyProperties(contacts,'date',utils.epochToDateString);
        contacts = utils.modifyProperties(contacts,'time',utils.epochToTimeString);

        //contacts = utils.renameProperties(contacts,'startTime','date');
        contacts = utils.renameProperties(contacts,'id','contactId');

        // console.log(contacts);

        // Get the contact metadata associated to each call
        exports.getContactMetadata(contacts, cbkFunc);

        //cbkFunc(null, utils.filterObjects(resultData,['id','startTime','callDuration','ani','dnis','ticket']));
      } else {
        // AQM server empty response
        console.log(utils.status(523,err));
        cbkFunc(utils.status(523,err), null);
      }
    });
  });
};


// Request Metadata for contact list from AQM server
// Args: contacts    Array of contact objects
//       cbkFunc     Callback function to call on completion
exports.getContactMetadata = function(contacts, cbkFunc){

  var contactOptions = JSON.parse(JSON.stringify(contactRequestOptions)),
      contactIndex   = 0,
      contactsWithMetadata = [];

  contacts.forEach(function(contact){

    contactOptions['url'] = baseUrl + contactUrl  + '/' + contact.contactId + '/metadata' ;

    console.log('Send request: ' + contactOptions['url']);
    request(contactOptions, function contactRequestCbk(err,res,body){
      //console.log('STATUS :: ' + res.statusCode);
      if (err) {
        // Error on HTTP request
        console.log(utils.status(520,err));
        cbkFunc(utils.status(520,err), null);

      } else if (res.statusCode == 200 && JSON.parse(body).length != 0) {
        //utils.showResult(err,res,body);

        contact['ticket'] = (JSON.parse(body))['Ticket']['value'] || '' ;
        contactsWithMetadata[contactIndex] = contact;
        contactIndex = contactIndex + 1;

        // We have gathered the metadata for all the contacts
        // now we can return a response
        if (contactsWithMetadata.length == contacts.length) {
          //console.log(contactsWithMetadata);
          cbkFunc(null,contactsWithMetadata.sort(utils.compare));
        };
      } else {
        // AQM server empty response
        console.log(utils.status(523,err));
        cbkFunc(utils.status(523,err), null);
      };

    });

    //contactIndex = contactIndex + 1;
    //console.log(contactsWithMetadata);
    //cbkFunc(contactsWithMetadata);
  });
};

// Send ticket number to AQM Server
// Args: params.contactId
//       params.ticketNum
exports.tagCall = function(params,cbkFunc){

   exports.authenticate(cbkFunc, function authenticationOk(cbkFunc){
     //console.log('getLastContacts. Sent request: ' + requestUrl);

     // Contact Metadata PUT Request
     var contactOptions = JSON.parse(JSON.stringify(contactMetadataRequestOptions)),
         requestUrl = contactOptions['url'] + '/' + params.contactId + '/metadata',
         ticketData = { Ticket: {key: 'Ticket', value: params.ticketNum }};

     contactOptions['url']  = requestUrl;
     contactOptions['body'] = JSON.stringify(ticketData);

     logger.info('Send metadata to AQM Server: ' + requestUrl);

     request(contactOptions, function contactRequestCbk(err,res,body){

       if (err) {
        // Error on HTTP request
         logger.info(utils.status(520,err));
         cbkFunc(utils.status(520,err), null);
       } else if (res.statusCode == 200 && body.length == 0) {
         // AQM server successfull response. An empty response from
         // AQM is a successfull response !!
         //console.log(body);

         // On successful completion include the original data sent on the request
         // so the client can identify which row/cell has changed and then display
         // those changes.
         cbkFunc(null, {status: '200',
                        contactId: params.contactId,
                        ticketNum: params.ticketNum,
                        message:   params.message});
       } else if (res.statusCode>=400 && res.statusCode<=599) {
         // AQM server error
         logger.info(utils.status(522,body));
         cbkFunc(utils.status(522,body), null);
       } else {
         // AQM server unknown error
         logger.info(utils.status(522,body));
         cbkFunc(utils.status(522,body), null);
       };

     });
   });
};

// Send ticket number to AQM Server. In this case the ticket
// number was sent to the MongoDb before the contact (recording) was
// completed.
// This is triggered by a "Notify Call End event" workflow on Finesse server
// Note that unanswered calls also trigger this event.
// Args:   params.extension
exports.deferredCallTagging = function(params,cbkFunc){

  // Contact Info GET Request last contact for extension
  var contactOptions = JSON.parse(JSON.stringify(contactRequestOptions)),
      requestUrl     = contactOptions['url'] + '?' +
                       querystring.stringify({ dnis:  params.extension,
                                               limit: 1 });

  contactOptions['url']  = requestUrl;
  logger.info('DEFERRED CALL TAGGING..');

  // Find any previous matching events for this dialogId (callId) if we find
  // a matching event then it means we had an ongoing call with that dialogId.
  // Otherwise if we cannot find any previous matching dialogId we had an
  // incoming call that was not answered so no recording (conctact) was generated.

  // Find call events associated with the current call, sort by time
  CallDataModel.find({callId: params.callId}, function(err,callEvents){

    logger.info('Previous callEvents for callId ' + params.callId + ': ' + callEvents);

    if (err) {;
      // Database error
      logger.info(utils.status(532,''));
      cbkFunc(utils.status(532,''),null);

    // Non empty response. We got previous call events.
    // If we got a previous ANSWER event for this callId then the call was answered
    // and continue processing, otherwise the call was not answered and stop processing
    } else if (callEvents.length != 0) {
      callEvents.sort(utils.compare);

      //console.log('GET find call events callId:' + params.callId );
      //logger.info('CALL EVENTS: ' + callEvents);


      exports.authenticate(cbkFunc, function authenticationOk(cbkFunc){
        logger.info('getLastContact. Sent request: ' + requestUrl );

        // Get last contact (recorded call) from AQM for the extension
        request(contactOptions, function contactRequestCbk(err,res,body){

          if (err) {
            // Error on HTTP request
            logger.info(utils.status(520,err));
            cbkFunc(utils.status(520,err),null);
          } else if (res.statusCode == 200 && body.length != 0) {

            var lastContact   = utils.filterObjects(JSON.parse(body),['id','startTime','callDuration','ani','dnis']),
                lastContactId = lastContact[0].id;

            // Get last ticket recorded on the database for the extension

            logger.info('Last Contact:' + JSON.stringify(lastContact));

            TicketDataModel.findOne( { callId: params.callId },function(err,ticket){
              if(err) {
                // Database error
                logger.info(utils.status(532,body));
                cbkFunc(utils.status(532,body),null);
              } else if (typeof ticket == 'undefined') {
                // Database empty response
                logger.info(utils.status(533,body));
                cbkFunc(utils.status(533,body),null);

              } else if (ticket != null){

                params['contactId'] = lastContactId;
                params['ticketNum'] = ticket.ticketNum;
                params['message']   = 'Deferred Ticket Assign';

                logger.info(JSON.stringify(ticket));
                logger.info('Found ticket:' + ticket.ticketNum + ' for callId:' + params.callId);
                // Update the ticket number metadata for the last contact we found for this extension
                exports.tagCall(params,cbkFunc);

              } else {
                logger.info('Ticket not found for callId:' + params.callId);
              }
            });


            // On successful completion call the callback function
            /*
            cbkFunc(null, {status:  '200',
                           called:  'DEFERRED',
                           lastContact: lastContactId,
                           extension: params.extension});
                           */

          } else if (res.statusCode>=400 && res.statusCode<=599) {
            // AQM server error
            logger.info(utils.status(522,body));
            cbkFunc(utils.status(522,body),null);
          } else {
            // AQM server unknown error
            logger.info(utils.status(522,body));
            cbkFunc(utils.status(522,body),null);
          };

        });
      });

    // Call not answered
    } else {

      logger.info('CALL NOT ANSWERED');
      cbkFunc(null, {status:  200,
                     info:    'CALL NOT ANSWERED'});

    };
  });

};























// Send ticket number to AQM Server
// Args: params.extension
exports.tagCallWithMetadata = function(params) {

  // Contact Auth POST Request
  request(authRequestOptions, function authRequestCbk(err,res,body){
    if (err) {
      console.log('Authentication to AQM server failed. '  + err);
    } else if (res.statusCode == 200) {
      //utils.showResult(err,res,body);
      console.log('Authentication to AQM successful.');
      // Contact Info  GET Request
      var contactOptions = JSON.parse(JSON.stringify(contactRequestOptions)),
          requestUrl     = contactOptions['url'] + '?' +
          querystring.stringify({ number:    params.extension,
                                  //beginTime: params.date,
                                  limit:     1 });

      contactOptions['url'] =  requestUrl;
      console.log('Send to AQM Server: ' + requestUrl);

      request(contactOptions, function contactRequestCbk(err,res,body){

        if (err) {
          console.log('Request to ' + requestUrl + ' failed. ' + err);
        } else if (res.statusCode == 200 && JSON.parse(body).length != 0) {
          utils.showResult(err,res,body);

          // Contact Metadata PUT Request
          var contactOptions = JSON.parse(JSON.stringify(contactMetadataRequestOptions)),
              contactId  = JSON.parse(body)[0].id,
              requestUrl = contactOptions['url'] + '/' + contactId + '/metadata';

          contactOptions['url']  = requestUrl;
          contactOptions['body'] = JSON.stringify(params.ticketInfo);

          console.log('Send to AQM Server: ' + requestUrl);

          request(contactOptions, function contactRequestCbk(err,res,body){

            utils.showResult(err,res,body);

          });
        } else {
          console.log('Response to ' + requestUrl + ' empty. Call not tagged.');
        }
      });
    }
  });
};



// Get last contacts (recorded call info) from AQM Server
// Args: params.extension   Extension  number
//       params.limit       Limit matching results
//       cbkFunc            Callback function to all on completion
exports._getLastContacts_ = function(params, cbkFunc) {

  // Auth POST Request to AQM server
  request(authRequestOptions, function authRequestCbk(err,res,body){
    if (err) {
      // Error on HTTP request
      console.log(utils.status(520,err));
      cbkFunc(utils.status(520,err),null);
    } else if (res.statusCode == 401) {
      // 401 Unauthorized from AQM
      console.log(utils.status(521,err));
      cbkFunc(utils.status(521,err),null);
    } else if (res.statusCode == 200) {
      // Authentication to AQM successfull, proceed with queries

      // Contact Info  GET Request
      var contactOptions = JSON.parse(JSON.stringify(contactRequestOptions)),
          defaultLimit   = 20,
          requestUrl     = contactOptions['url'] + '?' +
                           querystring.stringify({ number:    params.extension,
                                                   limit:     params.limit || defaultLimit });

      contactOptions['url'] =  requestUrl;
      console.log('getLastContacts. Sent request: ' + requestUrl);

      request(contactOptions, function contactRequestCbk(err,res,body){

        //console.log('STATUS: ' + res.statusCode);
        if (err) {
          // Error on HTTP request
          console.log(utils.status(520,err));
          cbkFunc(utils.status(520,err), null);
        } else if (res.statusCode == 200 && JSON.parse(body).length != 0) {
          //utils.showResult(err,res,body);
          // filter results and send response
          var contacts = utils.filterObjects(JSON.parse(body),['id','startTime','callDuration','ani','dnis']);

          //console.log(contacts);

          // Get the contact metadata associated to each call
          exports.getContactMetadata(contacts, cbkFunc);

          //cbkFunc(null, utils.filterObjects(resultData,['id','startTime','callDuration','ani','dnis','ticket']));
        } else {
          // AQM server empty response
          console.log(utils.status(523,err));
          cbkFunc(utils.status(523,err), null);
        }
      });
    }
  });
};
