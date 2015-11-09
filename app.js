var express = require('express'),
    path    = require('path'),
    favicon = require('serve-favicon'),
    //logger  = require('morgan'),
    fs      = require('fs'),
    nconf   = require('nconf'),
    exphbs  = require('express3-handlebars'),
    mongoose     = require('mongoose'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser');
    
var routes = require('./routes/routes'),
    utils  = require('./scripts/utils'),
    logger = require('./scripts/logger.js');
 
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
nconf.argv()
  .env()
  .file({ file: './config/config.json' });

var mongoUrl = nconf.get('mongoUrl'),
    app = express();

// connect to mongodb
mongoose.connect(mongoUrl, function(err,res){

  if (err) {
    logger.info ('ERROR connecting to: ' + mongoUrl + '. ' + err);
  } else {
    logger.info ('Succeeded. Connected to: ' + mongoUrl);
  };

});


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

var hbs = exphbs.create({
  helpers: {
    rndString:  function() { return utils.randomString(5); },
    cdataStart: function() { return "<![CDATA[" },
    cdataEnd:   function() { return "]]>" }
  }
});

app.engine('handlebars', exphbs({defaultLayout: 'CallLoggingGadgetDefault'}));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));

// parse URL parameters
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Remove random string at end of requested file name
// These requests are proxied first by Finesse server with caching
// getting on the way. This avoids caching.
app.use(function (req, res, next) {
  //console.log('Request URL: ' + req.url);
  req.url = req.url.replace(/_\w{5}/, '');
  //console.log('New Request URL:' + req.url);
  next();
});

// access to static resources
app.use(express.static(path.join(__dirname, 'public')));

// Setup the Express router middleware
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
