/*
  
   Encapsulate the functionality for REST requests
   It gets a reference to the gadgets object created by Finesse via the init method
   
   RestObj
    _myCreateAjaxHandler
    _myrestRequest
    _mymakeRequest
    _createNewSendDataService
    _init
  
    httpGet -> createRequest -> myRestRequest
*/


var _rest = function() {

  var  _htmlTemplateFunc =  {};


  // OK OK OK
  // We can only call this after the HTML table has been rendered
  var _attachEventHandlers = function() {

    /* Get all rows from your 'table' but not the first one
     * that includes headers. */
    //var rows = $('tr').not(':first');
    var rows = $('.contactTableRow');


    /* Create 'click' event handler for rows */
    rows.on('click', function(e) {

        //e.preventDefault();

        /* Get current row */
        var row = $(this);

        // unselect if previously selected
        if ( row.hasClass('highlight') ) {
          // Reset the contactId field
          $("#contactId").text('current call');
          row.removeClass('highlight');
          clientLogs.log('Unselected contact.');

        } else if ((e.ctrlKey || e.metaKey) || e.shiftKey) {
          /* If pressed highlight the other row that was clicked */
          // row.addClass('highlight');
        } else {
          /* Otherwise just highlight one row and clean others */

          rows.removeClass('highlight');
          row.addClass('highlight');
          //clientLogs.log('Highlight row .....................  ...');

          // Select the Contact Id. First cell in the row.
          var contactId = row.children('td:nth-child(1)').text();
          clientLogs.log('Selected contactId:' + contactId );

          //$("#contactId").html(contactId)  ;
          $("#contactId").html("<strong>"+padding_right(' ' + contactId,' ',12 )+"</strong>");
        };

    });

    
    // Click event handler for OK (send) button
    /*
    $("#submit").on('click',function(e){
      
      var ticketNum = $("#ticketnumber").val(),
          contactId = $("#contactId").text();
      clientLogs.log('OK Submit................ ' + ticketNum  + ' ' + contactId );
      
    });;
    */

    clientLogs.log('Event handlers attached.......................');
    clientLogs.log('JQuery version: ' + $.fn.jquery);
    //clientLogs.log('rows: ' + rows.text() );


  };
  

  return {

    _ver     : '0.0.1',
    _gadgets : {},           // Referece to the Opensocial Gadget script object
    _util    : {},           // Reference to utility functions
    _uiObj   : {},           // Reference to user interface functions
    _gadget  : {},           // Reference to the gadget object

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

  makeCallLoggingServiceRequest : function (url, handler, params) {
      
    clientLogs.log("In makeCallLoggingServiceRequest");
      
    params = params || {};
    params[this._gadgets.io.RequestParameters.HEADERS] = params[this._gadgets.io.RequestParameters.HEADERS] || {};
    
    this._gadgets.io.makeRequest(encodeURI(baseUrl) + url, handler, params);
    clientLogs.log("io.makeRequest to " + baseUrl + url);
  },
		
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
		
  _mycreateAjaxHandler : function (options) {
     
    var parentUser = this;

    return function (rsp) {

      var requestId, error = false, rspObj;

      if (options.success || options.error) {
        rspObj = {
          status: rsp.rc,
          content: rsp.text
        };
          
        //Some responses may not have a body.
					  
        if (rsp.text.length > 0) {
          try {
	    //TODO: Here you could parse xml into JSON, rather than just using the content in the success handler
	    clientLogs.log(rsp.text);
            // rspObj.object = gadgets.json.parse((parentUser._util.xml2json(jQuery.parseXML(rsp.text), "")));
          } catch (e) {
            error = true;
            rspObj.error = {
              errorType: "parseError",
              errorMessage: "Could not serialize XML: " + e
            };
          }
        } else {
          rspObj.object = {};
        }
          
        if (!error && rspObj.status >= 200 && rspObj.status < 300) {
          if (options.success) {
            options.success(rspObj);
          }
        } else {
          if (options.error) {
            options.error(rspObj);
          }
        }      
      }
    };
  },
	
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
	
  _myrestRequest : function (baseUrl,url,options) {

    var params, uuid;

    params = {};

    // Protect against null dereferencing of options allowing its (nonexistant) keys to be read as undefined
    options = options || {};
    options.success = this._util.validateHandler(options.success);
    options.error   = this._util.validateHandler(options.error);
      
    // Request Headers
    params[this._gadgets.io.RequestParameters.HEADERS] = {};
      
    // HTTP method is a passthrough to gadgets.io.makeRequest, makeRequest defaults to GET
    params[this._gadgets.io.RequestParameters.METHOD] = options.method;
       

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
      url += "nocache=" + this._util.currentTimeMillis();
    } else {

      /**
       * If not GET (ie POST), generate a requestID and add it to the headers, 
       **/
            
      uuid = this._util.generateUUID();
      params[this._gadgets.io.RequestParameters.HEADERS].requestId = uuid;
      params[this._gadgets.io.RequestParameters.GET_FULL_HEADERS] = "true";
 
      // For POST request convert JSON att/val pairs to query string and send that as the content
      options.content = $.param(options.content);
    }
    
    // Content Body
    if (typeof options.content === "object") {

      params[this._gadgets.io.RequestParameters.HEADERS]["Content-Type"] = "application/xml";
      params[this._gadgets.io.RequestParameters.POST_DATA] = this._util.json2xml(options.content);

   
    } else if (typeof options.content === "string") {
      // Assume string is a www form encoded data string
        
      params[this._gadgets.io.RequestParameters.HEADERS]["Content-Type"] = "application/x-www-form-urlencoded";
      params[this._gadgets.io.RequestParameters.POST_DATA] = options.content;
      clientLogs.log("Content typeOf: " + typeof(options.content));
    };

    // go do a makerequest
    this._mymakeRequest(baseUrl,encodeURI(url),this._mycreateAjaxHandler(options),params);
  },


  // Provides remote content retrieval 

  _mymakeRequest : function (baseUrl, url, handler, params) {
      
    //clientLogs.log("MYMQK : " + JSON.stringify(this) );
    clientLogs.log("In mymakeRequest");
      
    params = params || {};
    params[this._gadgets.io.RequestParameters.HEADERS] = params[this._gadgets.io.RequestParameters.HEADERS] || {};
    
    this._gadgets.io.makeRequest(encodeURI(baseUrl) + url, handler, params);
    clientLogs.log("io.makeRequest to " + baseUrl + url);
  },


  _createNewSendDataServiceRequest : function(baseUrl, reqUrl, data, handlers) {
      var contentBody = $.param(data);

      clientLogs.log('In createNewSendDataServiceRequest contentBody=' +  contentBody);
  
      handlers = handlers || {};
       
      this._myrestRequest( baseUrl, reqUrl, {
        method: 'POST',
        success: handlers.success,
        error:   handlers.error,
        content: contentBody
      });

      return this; 

    },

    /**
     *  Create the query string for the POST request
     */
    _createNewCallLoggingServicesRequest : function (baseUrl, reqUrl, callData, handlers) {

      var contentBody = "";

      contentBody = contentBody + "&callId="      + encodeURIComponent(callData.callId);
      contentBody = contentBody + "&fromAddress=" + encodeURIComponent(callData.fromAddress);
      contentBody = contentBody + "&toAddress="   + encodeURIComponent(callData.toAddress);
      contentBody = contentBody + "&callType="    + encodeURIComponent(callData.callType);
      contentBody = contentBody + "&callState="   + encodeURIComponent(callData.callState);
      contentBody = contentBody + "&DNIS="        + encodeURIComponent(callData.DNIS);

      clientLogs.log("In createNewCallLoggingServicesRequest");
      
      handlers = handlers || {};
       
      this._myrestRequest( baseUrl, reqUrl, {
        method: 'POST',
        success: handlers.success,
        error:   handlers.error,
        content: contentBody
      });
      return this; 
    },


  // Handlers for success and error events -----------------------

  _handlerGetHtmlTableTemplateSuccess: function(res){
    
    _htmlTemplateFunc = Handlebars.compile(res.content);
    clientLogs.log("HTML Template loaded from server and compiled");

  },

  _handlerGetHtmlTableTemplateError: function(res){
    clientLogs.log('----ERROR template---- ' + res);
  },
    
  _handlerGetLastCallsSuccess: function(res){
    $('.alert-danger').hide();
   // $('#alert-warning').show();
   // $('.alert-success').hide();

    $('.alert-success #message').text('SUCCESS : ' + JSON.stringify(res.content));
    //$('.alert-success').show();
    
    $('.table').remove();
    $('#tablePlaceholder').append(_htmlTemplateFunc({lastCalls: JSON.parse(res.content)}));

    clientLogs.log("Appended HTML table after calling handlebars template funcition.");
    //this._uiObj._alive();
    // Now the html table has been appended, attach the event handlers
    _attachEventHandlers();

  },

  _handlerGetLastCallsError: function(res){
    $('.alert-success #message').text('ERROR: ' + res);
    $('.alert-danger').show();

  },

  _handlerSetTicketNumberSuccess: function(res){

    var resp       = JSON.parse(res.content),
        ticketNum  = resp.ticketNum,
        contactId  = resp.contactId,
        htmlCell   = $('.contactTableRow.highlight td:nth-child(6)');                
        

    // Go find the row/cell where the changed data is located and do update
    
    clientLogs.log("Set Ticket Success." + ' Resp:'+resp);
    clientLogs.log("Data: " + contactId+' '+ticketNum);
    clientLogs.log(JSON.stringify(res));

    // Update the HTML cell with the new value
    htmlCell.html(ticketNum);
    
  },

  _handlerSetTicketNumberError: function(res){
    
    clientLogs.log("Set Ticket. Error !!");

  },


  //--------------------------------------------------------------------------
  // Generic "I don't care" event handlers. Just log the success / error 
  // following the request
  //

  _handlerSuccessGeneric: function(res){
     clientLogs.log("_handlerSuccessGeneric(). Generic success event REST handler called.");
  },

  _handlerErrorGeneric:  function(res){
     clientLogs.log("_handlerErrorGeneric(). Generic error event REST handler called");
  },
   
  //--------------------------------------------------------------------------
  // Generic mehtod for http GET and POST requests
  // handlers are passed here as strings, then
  // we make a lookup of that handlers' name and get the handler function back

  _httpRequest: function(method,baseUrl,reqUrl,jsonData,handlers){

    clientLogs.log("IN httpRequest() "+method+" "+baseUrl+reqUrl );
    
    var handlers = {success: this[handlers.success],
                    error:   this[handlers.error]};

    this._myrestRequest( baseUrl, reqUrl, {
        method:  method,
        success: handlers.success,
        error:   handlers.error,
        content: jsonData
      });

    return this; 
    //this._createRequest(baseUrl,reqUrl,jsonData,handlers);

  },
    
 
  _createRequest: function (baseUrl,reqUrl,jsonData,handlers) {
    var handlers = handlers || {};
       
      clientLogs.log("IN createRequest()");

      this._myrestRequest( baseUrl, reqUrl, {
        method: 'GET',
        success: handlers.success,
        error:   handlers.error,
        content: jsonData
      });
      return this; 
  },


  _makeCallLoggingServiceSuccess : function(rsp) {
       
    clientLogs.log ("In makeCallLoggingServiceSuccess CallLoggingGadget");
    
  },

  
    
  /**
   * Handler for makeCallLoggingService when error occurs.
   */

  _makeCallLoggingServiceError : function(rsp) {
	
    clientLogs.log("In makeCallLoggingServiceError");
    clientLogs.log(rsp);
  },

  _tagCall : function (baseUrl, reqUrl, callData) {
      
    clientLogs.log("In tagCall, make createNewCallLoggingServiceRequest with call: " + callData.callId);
       
    this._createNewCallLoggingServicesRequest(baseUrl, reqUrl, callData, {
      success: this._makeCallLoggingServiceSuccess,
      error:   this._makeCallLoggingServiceError
    });
            
  },

    __tagCall : function (baseUrl, reqUrl, data) {
      
      clientLogs.log("In tagCall, make createNewSendDataServiceRequest.");
      
      this._createNewSendDataServiceRequest(baseUrl, reqUrl, data, {
        success: this._makeCallLoggingServiceSuccess,
        error:   this._makeCallLoggingServiceError
      });
            
   },


  _alive: function() {

    clientLogs.log("restObj is alive");

  },

  _test : function(callId) {
       
    clientLogs.log("Test function with callId: " + callId);
       
  },
  
  _init : function(gadgets,util,uiObj,gadget){
    clientLogs.log('Init restReq. uiObj: ' + uiObj );
    //uiObj._alive();
    gadget.testMe();

    this._gadgets = gadgets;
    this._util    = util;
    this._uiObj   = uiObj;
    this._gadget  = gadget;
  }


  

};
};
