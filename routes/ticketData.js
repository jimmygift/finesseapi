
var express = require('express');

var router  = express.Router(),
    TicketDataModel = require('../controllers/TicketData');

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

module.exports = router;







