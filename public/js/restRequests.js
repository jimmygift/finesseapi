/*

    Module Encapsulating the functionality for REST requests
    Only works with JSON data

    jimmygift  20/11/2015

    httpGet  -> _myRestRequest -> _mymakeRequest

    _mycreateAjaxHandler
    _myrestRequest
    _mymakeRequest

*/

var _REST = (function($,_gadgets,_util){
   var version = 0.23;
    /**
     * _mycreateAjaxHandler is a Utility method to create ajax response handler closures around the
     * provided callbacks. Callbacks should be passed through from .ajax().
     * makeRequest is responsible for garbage collecting these closures.
     * @param {Object} options
     *     An object containing success and error callbacks.
     * @param {Function} options.success(rsp)
     *     A callback function to be invoked for a successful request.
     *     {
     *         status: {Number} The HTTP status code returned
     *         content: {String} Raw string of response
     *         object: {Object} Parsed object of response
     *     }
     * @param {Function} options.error(rsp)
     *     A callback function to be invoked for an unsuccessful request.
     *     {
     *         status: {Number} The HTTP status code returned
     *         content: {String} Raw string of response
     *         object: {Object} Parsed object of response
     *         error: {Object} Wrapped exception that was caught
     *         error.errorType: {String} Type of error that was caught
     *         error.errorMessage: {String} Message associated with error
     *     }
     * @private
     */

  function _mycreateAjaxHandler(options){
    return function(rsp){
      var requestId, error = false, rspObj;
      if (options.success || options.error) {
        rspObj = {
          status:  rsp.rc,   // Response code
          content: rsp.text  // Response text
        };

        // Call the success or error callbacks
        if (!error && rspObj.status >= 200 && rspObj.status < 300) {
          if (options.success) {options.success(rspObj); }
        } else {
          if (options.error)   {options.error(rspObj); }
        }
      }
    }
  };

    /** myrestRequest
     * my modification of Utility method to make an asynchronous request
     * @param {String} url
     *     The unencoded URL to which the request is sent (will be encoded)
     * @param {Object} options
     *     An object containing additional options for the request.
     * @param {Object} options.content
     *     An object to send in the content body of the request. Will be
     *     serialized into XML before sending.
     * @param {String} options.method
     *     The type of request. Defaults to "GET" when none is specified.
     * @param {Function} options.success(rsp)
     *     A callback function to be invoked for a successful request.
     *     {
     *         status: {Number} The HTTP status code returned
     *         content: {String} Raw string of response
     *         object: {Object} Parsed object of response
     *     }
     * @param {Function} options.error(rsp)
     *     A callback function to be invoked for an unsuccessful request.
     *     {
     *         status: {Number} The HTTP status code returned
     *         content: {String} Raw string of response
     *         object: {Object} Parsed object of response
     *         error: {Object} Wrapped exception that was caught
     *         error.errorType: {String} Type of error that was caught
     *         error.errorMessage: {String} Message associated with error
     *     }
    */

  function _myrestRequest(baseUrl,url,options){
    var params = {};
    var uuid;

    // Protect against null dereferencing of options allowing its (nonexistant) keys to be read as undefined
    options = options || {};
    options.success = _util.validateHandler(options.success);
    options.error   = _util.validateHandler(options.error);

    // Request Headers
    params[_gadgets.io.RequestParameters.HEADERS] = {};

    // HTTP method is a passthrough to gadgets.io.makeRequest, makeRequest defaults to GET
    params[_gadgets.io.RequestParameters.METHOD] = options.method;

    //true if this should be a GET request, false otherwise
    if (!options.method || options.method === "GET") {
      if (options.content) {
        url += "?" + $.param(options.content);
      };
      //Disable caching for GETs
      if (url.indexOf("?") > -1) {
        url += "&";
      } else {
        url += "?";
      }
      url += "nocache=" + _util.currentTimeMillis();
    } else {
      // If not GET (ie POST), generate a requestID and add it to the headers,
      uuid = Math.uuidCompact();
      params[_gadgets.io.RequestParameters.HEADERS].requestId = uuid;
      params[_gadgets.io.RequestParameters.GET_FULL_HEADERS] = "true";
      // For POST request convert JSON att/val pairs to query string and send that as the content
      options.content = $.param(options.content);
    };

    if (typeof options.content === "string") {
      // Assume string is a www form encoded data string
      params[_gadgets.io.RequestParameters.HEADERS]["Content-Type"] = "application/x-www-form-urlencoded";
      params[_gadgets.io.RequestParameters.POST_DATA] = options.content;
      //clientLogs.log("Content typeOf: " + typeof(options.content));
    };

    _mymakeRequest(baseUrl,encodeURI(url),_mycreateAjaxHandler(options),params);
  };

    /**
     * mymakeRequest is a Proxy method for gadgets.io.makeRequest. The will be identical to gadgets.io.makeRequest
     * ClientServices will mixin the BASIC Auth string, locale, and host, since the
     * configuration is encapsulated in here anyways.
     * This removes the dependency
     * @param {String} url
     *     The relative url to make the request to (the host from the passed in config will be
     *     appended). It is expected that any encoding to the URL is already done.
     * @param {Function} handler
     *     Callback handler for makeRequest to invoke when the response returns.
     *     Completely passed through to gadgets.io.makeRequest
     * @param {Object} params
     *     The params object that gadgets.io.makeRequest expects. Authorization and locale
     *     headers are mixed in.
     */

  function _mymakeRequest(baseUrl,url,handler,params){
    params = params || {};
    params[_gadgets.io.RequestParameters.HEADERS] = params[_gadgets.io.RequestParameters.HEADERS] || {};

    _gadgets.io.makeRequest(encodeURI(baseUrl)+url,handler,params);
    //clientLogs.log("io.makeRequest to " +baseUrl+url);
  };

  function _getVersion(){return version};

   // Pass handlers as {success: successHandler, error: errorHandler}
  return {
    httpRequest: function(method,baseUrl,reqUrl,jsonData,handlers){
      //clientLogs.log("IN httpRequest() "+method+" "+baseUrl+reqUrl);
      _myrestRequest(baseUrl,reqUrl, {
           method:  method,
           success: handlers.success,
           error:   handlers.error,
           content: jsonData
      });
    },
    getVersion: function(){return _getVersion()},
    isAlive: function(){
       return "REST object is alive !!";
    }
  };

}(jQuery,gadgets,finesse.utilities.Utilities));
