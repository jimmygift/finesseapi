var mongoose  = require('mongoose'),
    restReq   = require('../scripts/restReq'),
    utils     = require('../scripts/utils');

var TicketDataModel = require('../models/ticketData').model('ticketData'),
    CallDataModel   = require('../models/callData').model('callData'),
    logger          = require('../scripts/logger.js');

// GET lastContacts on AQM server
exports.getLastContacts = function(req,res){
  var params = { extension: req.query.extension,
                 limit:     req.query.limit };

  // Get the last contacts (recorded calls) for specified extension
  restReq.getLastContacts(params, function(err,contacts){
    if (err){
      //res.send(500, err.error.message);
      res.status(500).jsonp(err);
    } else {

      // ... then get the metadata for each returned contact Id
      restReq.getContactMetadata(contacts,function(err,contactsWithMetadata){
        //res.status(200).jsonp(contactsWithMetadata);
        if (err) {
          res.status(500).jsonp(err);
        } else {
          res.status(200).jsonp(contactsWithMetadata);
        }
      });
      //res.status(200).jsonp(contacts);
    };
  });
};

// GET find all entries on MongoDB
exports.findAll = function(req,res){
  CallDataModel.find(function(err, files){
    if(err) res.send(500, err.message);

    logger.info('GET calls/findAll');
    res.status(200).jsonp(files);
  });
};

// GET find entry by id on MongoDB
exports.findById = function(req,res){
  CallDataModel.findById(req.params.id,  function(err, item){
    if(err) return  res.send(500, err.message);
    logger.info('GET calls/findById' + req.params.id );

    res.status(200).jsonp(item);
  });
};

// POST new entry on MongoDB
exports.add = function(req,res){
  var params = req.body;
  logger.info('POST callId:' + params.callId + ' from:'   + params.fromAddress + ' to:'+  params.toAddress +
              ' DNIS:' + params.extension + ' callState:' + params.callState + ' callType:' + params.callType);


  // Got notification of call ending from Finesse Workflow
  if (params.callState==='CLOSE'){

    // Wait some seconds in order to give AQM server time to process the recording
    // Get last contact (recorded call) from AQM for the extension
    // Get last ticket recorded on the database for the extension
    // Update the ticket number metadata for the contact we found

    //logger.info('GOT CLOSE EVENT..');

    setTimeout(restReq.deferredCallTagging(params,function(err,result){
      if (err) {
        res.status(500).jsonp(err);
      } else {
        res.status(200).jsonp(result);
      }
    }),3000);

  } else if (params.callState==='ANSWERED'){

    //logger.info('GOT ANSWERED EVENT..');

  };

  var callData  = new CallDataModel({
    callId:      params.callId,
    callType:    params.callType,
    fromAddress: params.fromAddress,
    toAddress:   params.toAddress,
    DNIS:        params.DNIS,
    callState:   params.callState,
    date:        req.date
  });

  callData.save(function(err){
    if (err) {
      return res.send(500, err.message);
    } else {

      // Just save the call data
    };
  });
};
