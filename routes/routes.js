
var express = require('express'),
    fs      = require('fs'),
    nconf   = require('nconf'),
    restReq = require('../scripts/restReq'),
    utils   = require('../scripts/utils'),
    logger  = require('../scripts/logger.js'),
    gconfig = require('../scripts/gadgetConfig');


var router  = express.Router(),
    CallDataModel   = require('../controllers/CallData'),
    TicketDataModel = require('../controllers/TicketData'),
    RemoteLoggingModel = require('../controllers/RemoteLoggingData');

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
    serverConfig = { rndString: rndString },
    serverIpAddr = utils.getIpAddress() || gadgetServerHost,
    serverPort   = nconf.get('PORT') || nconf.get('gadgetPort'),
    gadgetConfig = null;

logger.info('Gadget Server: ' + serverIpAddr + ':' + serverPort + '/gadget');

require('fs').readFile('./config/' + nconf.get('gadgetConfig'), 'utf8', function (err,data) {
  if (err) throw err; // we'll not consider error handling for now
  gadgetConfig = JSON.parse(data)
});

// Remote logging for Finesse Gadgets ------------------------------------------

router.post('/finesseLogging', function(req,res){
  var headers   = req.headers,
      body      = req.body,
      userIp    = req.ip,
      userExt   = body.user,
      userAgent = headers['user-agent'],
      jsonMsg   = JSON.parse(body.msg);

  jsonMsg['ip'] = userIp;
  jsonMsg['user'] = userExt;

  logger.info(JSON.stringify(jsonMsg));

  //logger.info(JSON.stringify(req.headers));
  //logger.info(' ' + userIp + ' : ' + userAgent + ' : '+ req.body.user + ' : ' + req.body.msg);

  //req.date = new Date();
  //RemoteLoggingModel.add(req, res);
});

router.post('/pong', function(req,res){
  var resp = JSON.stringify({timestamp: req.body.timestamp});
  //res.setHeader('Content-Type', 'application/json');
  res.status(200).json({timestamp: req.body.timestamp});
});

// Call Processing -------------------------------------------------------------

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

// Gadget
router.get('/gadget',function(req, res){
  res.contentType('text/xml');
  res.render('CallLoggingGadget', { serverConfig:     serverConfig,
                                    gadgetTitle:      nconf.get('gadgetTitle'),
                                    gadgetDesc:       nconf.get('gadgetDesc'),
                                    gadgetHeight:     nconf.get('gadgetHeight'),
                                    gadgetScroll:     nconf.get('gadgetScroll'),
			     	                        //gadgetServerHost: nconf.get('gadgetHost'),
                                    gadgetServerHost: serverIpAddr,
                     	     	        gadgetServerPort: serverPort,
                                    vxmlServerHost:   nconf.get('vxmlServerHost'),
                                    vxmlServerPort:   nconf.get('vxmlServerPort'),
                                    vxmlServerPath:   nconf.get('vxmlServerPath'),
                                    transferDirn:     nconf.get('vxmlTransferDirn'),
                                    pingEnabled:      nconf.get('pingEnabled'),
                                    pingInterval:     nconf.get('pingInterval'),
                                    finesseEventsLogging: nconf.get('finesseEventsLogging'),
			     	                        layout: 'CiscoFinesseGadgets'});
});

router.get('/home', function (req, res){
  res.render('home',
             {layout: false });
});

// Get ReactJS config for the rendering of UI components on the Finesse Gadget
router.get('/getReactConfig', function(req,res){
  var extension  = req.query.extension,
      team       = req.query.team;

  var result = gconfig.getGadgetConfig(extension,team,gadgetConfig);

  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({error: "no result"});
  }
  //res.status(200).json({gadgetConfig: req.query.extension});
  //res.status(200).json({config: 'hello', extension: req.query.extension, teamName: req.query.teamName});
});

router.get('/gadgetConfig', function (req,res){
  res.status(200).json(gadgetConfig);
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
