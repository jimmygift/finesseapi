
var mongoose    = require('mongoose'),
    querystring = require('querystring'),
    request     = require('request'),
    fs          = require('fs'),
    nconf       = require('nconf'),
    restReq     = require('../scripts/restReq'),
    utils       = require('../scripts/utils');

var TicketDataModel = require('../models/ticketData').model('ticketData'),
    CallDataModel   = require('../models/callData').model('callData'),
    logger          = require('../scripts/logger.js');

nconf.argv()
  .env()
  .file({ file: 'config/config.json' });

// GET /tickets
exports.findAll = function(req,res){
  TicketDataModel.find(function(err, files){
    if(err) res.send(500, err.message);

    console.log('GET findAll');
    res.status(200).jsonp(files);
  });
};

// GET /tickets/:id
exports.findById = function(req,res){
  TicketDataModel.findById(req.params.id,  function(err, item){
    if(err) return  res.send(500, err.message);

    logger.log('GET findById' + req.params.id );
    res.status(200).jsonp(item);
  });
};

// POST  /tickets
exports.add = function(req, res){
  var params = req.body;

  logger.info('POST ticketNum:' + params.ticketNum  + ' contactId:' + params.contactId);

  if (params.contactId && params.ticketNum && (!isNaN(params.contactId))) {
    // We're tagging a previously recorded call contact
    logger.info('Tagging a recorded call. ticketNum:' + params.ticketNum  + ' contactId:' + params.contactId );

    // Send the metadata to AQM server
    restReq.tagCall(params,function(err,resp){
      if (err) {
        res.status(500).jsonp(err);
      } else {
        res.status(200).jsonp(resp);
      }
    });
  } else if (params.contactId === 'current call' ){
    logger.info('Tagging an active call.  ticketNum:' + params.ticketNum  + ' contactId:' + params.contactId );
    restReq.deferredCallTagging(params,function(err,resp){
      if (err) {
        res.status(500).jsonp(err);
      } else {
        res.status(200).jsonp(resp);
      }
    });
  } else if (params.callId) {
    console.log('Tagging an active call..');
  }


  var ticketData  = new TicketDataModel
  // Ticket datamodel for data sent to mongodb
  ({
    ticketNum:   params.ticketNum,
    contactId:   params.contactId,
    callId:      params.callId,
    date:        req.date
  });

  // Save call event data to mongodb
  ticketData.save(function(err){
    if (err) {
      //return res.send(500, err.message);
    } else {
      //res.status(200).jsonp(ticketData);
    }

  });
};













// POST
exports.add_ = function(req,res){
  var params = req.body;

  console.log('POST ticketNum:' + params.ticketNum + ' extension:' + params.extension + ' agentState:' + params.state + ' callId:' + params.callId);

  var ticketData  = new TicketDataModel
  // Ticket datamodel for data sent to mongodb
  ({
    ticketNum:   params.ticketNum,
    agentState:  params.state,
    extension:   params.extension,
    callId:      params.callId,
    date:        req.date
  });

  // Ticket data sent to AQM server
  params['ticketInfo'] = { Ticket: {key: 'Ticket', value: params.ticketNum }};

  // Save call event data to mongodb
  ticketData.save(function(err){
    if (err) return res.send(500, err.message);
    res.status(200).jsonp(ticketData);
  });


  // we need an active call
  if (params.callId.length != 0) {

    // Find call events associated with the current call, sort by time
    CallDataModel.find( {callId: params.callId},  function(err, callEvents){
      if(err) return  res.send(500, err.message);

      callEvents.sort(utils.compare);

      console.log('GET find call events callId:' + params.callId );
      console.log(callEvents);

      // Get the date of the first call event and pass to HTTP request
      params['date']  = utils.dateTolocalTimezone(new Date(callEvents[0]['date']));

      if (callEvents.length == 1) {
        // Call Ringing. Ignore any tagging data sent by client.
        console.log('Got 1 call event.');
      } else if (callEvents.length == 2) {
        // The call is still active, save ticket only on mongodb, we can't yet
        // tag the call with the metadata on the AQM server until the call is finished.
        console.log('Got 2 call events.');

      } else if (callEvents.length == 3) {
        // The call is over. Now we can tag the call with metadata on the AQM server.
        console.log('Got 3 call events.');
        restReq.tagCallWithMetadata(params);
        // Check if the ticket number was sent before the call finished
      }
    });
  };
};
