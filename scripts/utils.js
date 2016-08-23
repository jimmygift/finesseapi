
var format = require('date-format');

/*
  Response Status Codes
*/
exports.status = function(code,err){
  var statusCodes = {

    520: 'HTTP REQUEST ERROR',
    521: 'UPSTREAM HTTP AUTHENTICATION FAILED',
    522: 'UPSTREAM HTTP REQUEST ERROR',
    523: 'UPSTREAM HTTP EMPTY RESPONSE',
    532: 'MONGO DB ERROR',
    533: 'DATABASE EMPTY RESPONSE'
  };
  return {code:   code,
          status: statusCodes[code],
          error:  err};
};

// Compare dates
exports.compareb = function(a,b) {
  // Compare dates
  if (a.date < b.date)
    return -1;
  if (a.date > b.date)
    return 1;
  return 0;
};

// Compare objects by 'prop'
exports.compare = function(a,b) {
  var prop='startTime';
  var order=1;   //last first

  // last first
  if (order) {
    if (a[prop] > b[prop])
      return -1;
    if (a[prop] < b[prop])
      return 1;
    return 0;

  // first last
  } else {
    if (a[prop] < b[prop])
      return -1;
    if (a[prop] > b[prop])
      return 1;
    return 0;
  }

};

exports.dateTolocalTimezone = function (date) {
  // Convert  date from UTC to local timezone
  var localTime  = date.getTime() - (date.getTimezoneOffset() * 60 * 1000) - (10 * 1000);
  // Date format 2015-05-21+13:00:0
  return (new Date(localTime)).toISOString().replace(/T/, '+').replace(/\..+/, '');
};

//
exports.epochToDateString = function (epochTime){

  return format.asString('dd/MM/yyyy', new Date(epochTime));

};

exports.epochToTimeString = function (epochTime){

  return format.asString('hh:mm:ss', new Date(epochTime));

};

// Show result of HTTP request
exports.showResult = function (err,res,body){
  if (!err && res.statusCode == 200) {
    if (body.length != 0) {
      var info = JSON.parse(body);
      console.log(info);
    } else if (body.length == 0){
      console.log('Status Code: ' + res.statusCode);
    };
  } else if ( res.statusCode>=400 && res.statusCode<=599 ) {
    console.log('Error on request Status:' +  res.statusCode);
  } else if (err) {
    console.log('Error on request: ' + err );
  }
};

// Generate a random string
// numChars   Number of characters on random string
exports.randomString = function(numChars) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < numChars; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};


// Filter array of JSON objects
//    objs    Array of objects
//    props   Array of properties
exports.filterObjects = function (objs,props){

  Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
  };

  var newObjs = [];

  objs.forEach(function(obj){
    //console.log(obj);
    var newObj = {};
    for (var p in obj){
        //console.log(p);
        if (props.contains(p)){ newObj[p] = obj[p]; }
    }
    if( Object.keys(newObj).length) {newObjs.push(newObj);};
  });
  return newObjs;
};

exports.renameProperties_ = function (objs,oldProp,newProp){

  var rename = function rename(obj, oldName, newName) {
    if(!obj.hasOwnProperty(oldName)) {
      return false;
    }

    obj[newName] = obj[oldName];
    delete obj[oldName];
    return true;
  };

  for (var obj in objs){
    rename(obj,oldProp,oldProp);
  };

  return objs;
};


// Rename property for an  array of JSON objects
//    objs      Array of objects
//    oldProp   Property to rename
//    newProp   New name for property
exports.renameProperties = function(objs,oldProp,newProp){

  var newObjs = [];
  for(var i = 0; i < objs.length; i++){
    objs[i][newProp] = objs[i][oldProp];
    delete objs[i][oldProp];
    newObjs.push(objs[i]);
  }
  return newObjs;
};


// Modify property value for an array of JSON objects
//    objs      Array of objects
//    prop      Property to modify
//    func      Function to apply to property
exports.modifyProperties = function(objs,prop,func){
  var newObjs = [];
  for(var i = 0; i < objs.length; i++){
    objs[i][prop] = func(objs[i][prop]);
    newObjs.push(objs[i]);
  }
  return newObjs;
};

// Modify property value for an array of JSON objects
//    objs      Array of objects
//    prop      Property to duplicate
//    newProp   Name for new property
exports.duplicateProperty = function(objs,prop,newProp){
  var newObjs = [];
  for(var i = 0; i < objs.length; i++){
    objs[i][newProp] = objs[i][prop];
    newObjs.push(objs[i]);
  }
  return newObjs;
};


// Get IP address of host
// http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js

exports.getIpAddress = function(){
  var os = require('os');
  var ifaces = os.networkInterfaces();
  var ipAddress = null;

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        // console.log(ifname + ':' + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        ipAddress = iface.address;
        //return(iface.address);
      }
      ++alias;
    });
  });

  return ipAddress;
};
