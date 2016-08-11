var mongoose  = require('mongoose'),
    utils     = require('../scripts/utils');

var LogDataModel  = require('../models/logData').model('logData'),
    logger        = require('../scripts/logger.js');

// POST new entry on MongoDB
exports.add = function(req,res){

  var logData  = new LogDataModel({
    user:      req.body.user,
    msg:       req.body.msg
  });

  logData.save(function(err){
    if (err) {
      return res.send(500, err.message);
    } else {
      res.send(200);
    };
  });

}
