
var express = require('express'),
    fs      = require('fs'),
    nconf   = require('nconf'),
    restReq = require('../scripts/restReq'),
    utils   = require('../scripts/utils');


var router  = express.Router(),
    CallDataModel   = require('../controllers/CallData'),
    TicketDataModel = require('../controllers/TicketData');

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'

nconf.argv()
  .env()
  .file({ file: './config/config.json' });

var clientConfig = { gadgetServerHost: nconf.get('gadgetHost'),
                     gadgetServerPort: nconf.get('gadgetPort') },
    rndString    =   utils.randomString(5),
    serverConfig = { rndString: rndString };
 
// Call Processing --------------------------

router.post('/calls', function(req, res){

  req.date = new Date();
  CallDataModel.add(req, res);

});

router.get('/calls/:id',function(req, res){

  CallDataModel.findById(req, res);

});

router.get('/calls',function(req, res){

  CallDataModel.findAll(req, res);

});

router.get('/getLastContacts',function(req, res){

  CallDataModel.getLastContacts(req, res);

});

// Ticket Processing --------------------------

router.post('/tickets', function(req, res){

  req.date = new Date();
  TicketDataModel.add(req, res);

});

router.get('/tickets/:id',function(req, res){
  
  TicketDataModel.findById(req, res);

});

router.get('/tickets',function(req, res){

  TicketDataModel.findAll(req, res);

});

// Open Social Gadgets HTML ---------------------------------

// Call Logging Gadget
router.get('/gadget',function(req, res){
  res.contentType('text/xml');
  res.render('CallLoggingGadget', { serverConfig:  serverConfig,  
			     	    gadgetServerHost: nconf.get('gadgetHost'),
                     	     	    gadgetServerPort: nconf.get('gadgetPort'),
			     	    layout: 'CallLoggingGadgetDefault'});
});


// Call Transfer Gadget
router.get('/gadget/CallTransfer',function(req,res){
  res.contentType('text/xml');
  res.render('CallTransferGadget', { serverConfig:  serverConfig,  
			     	     gadgetServerHost: nconf.get('gadgetHost'),
                     	     	     gadgetServerPort: nconf.get('gadgetPort'),
                                     vxmlServerHost:   nconf.get('vxmlServerHost'),
                                     vxmlServerPort:   nconf.get('vxmlServerPort'),
                                     vxmlServerPath:   nconf.get('vxmlServerPath'),
                                     transferDirn:     nconf.get('vxmlTransferDirn'),
                                     layout: 'CallTransferGadgetDefault' });
});


router.get('/home', function (req, res){
  res.render('home', 
             {layout: false });
});


// Non Open Social (just HTML) client config

router.get('/client',function(req, res){

  // just 'bounce back' the parameter on the request back to the client
  //res.json({extension: req.query.extension});
  res.render('htmlClient', {extension: req.query.extension});
  
});

// Get Server Config -------------------------------

router.get('/serverConfig',function(req, res){
  
  res.status(200).jsonp(serverConfig);

});

// Client Config -------------------------------

// Send configuration information to remote client
router.get('/clientConfig',function(req, res){
  res.status(200).jsonp(clientConfig);
});

module.exports = router;
