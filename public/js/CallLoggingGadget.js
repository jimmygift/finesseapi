/*
*   CallLoggingGadget
*
*
*   CallLoggingGadget <------> Proxy                  <-----> CallLoggingService <----->  NoSQvL Datastore
*   Cisco Finesse Agent        Cisco Finesse Server           node.js                     MongoDB
*
*                                                                                <----->  AQM Recording Server

*
*   Browser can't have connections to servers in multiple domains due to security considerations so Cisco Finesse
*   functions as web proxy so all requests from the browser use a single domain

*   makeCallLogingServiceRequest -> createNewCallLoggingServicesRequest


*  Gotchas
      Finesse server always caches the files



   finesse.gadget.Config

   finesse.modules.CallLooggingGadget
      init
      getHtmlTableTemplate
      getLastContacts
      setTicketNumber



Google Gadgets API
https://developers.google.com/gadgets/docs/overview

Cisco Finesse API
https://developer.cisco.com/site/finesse/

*/

var reqUrl   = '/calls',
    restObj  = {},       // HTTP REST Request functionality
    uiObj    = {},       // User interface
    extensionNum = '';

var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
var clientLogs = finesse.cslogger.ClientLogger || {};

// Gadget Config needed for instantiating ClientServices
/** @namespace */
finesse.gadget.Config = (function () {
  var _prefs = new gadgets.Prefs();

  /** @scope finesse.gadget.Config */
  return {
    authorization: _prefs.getString("authorization"),
    country: _prefs.getString("country"),
    language: _prefs.getString("language"),
    locale: _prefs.getString("locale"),
    host: _prefs.getString("host"),
    hostPort: _prefs.getString("hostPort"),
    extension: _prefs.getString("extension"),
    mobileAgentMode: _prefs.getString("mobileAgentMode"),
    mobileAgentDialNumber: _prefs.getString("mobileAgentDialNumber"),
    xmppDomain: _prefs.getString("xmppDomain"),
    pubsubDomain: _prefs.getString("pubsubDomain"),
    restHost: _prefs.getString("restHost"),
    scheme: _prefs.getString("scheme"),
    localhostFQDN: _prefs.getString("localhostFQDN"),
    localhostPort: _prefs.getString("localhostPort"),
    clientDriftInMillis: _prefs.getInt("clientDriftInMillis")

    //gadgetServerHost: _prefs.getString('gadgetServerHost'),
    //gadgetServerPort: _prefs.getString('gadgetServerPort')
  };
}());

/** @namespace */
finesse.modules = finesse.modules || {};
finesse.modules.CallLoggingGadget = (function ($) {

  var user, dialogs, states, callId,
      // Get custom paramaters from the Prefs defined at the gadget XML definition file
      prefs    =  new gadgets.Prefs(),
      baseUrl  = 'http://' + prefs.getString("gadgetServerHost") + ':' + prefs.getString("gadgetServerPort"),

      // Send notification of incoming call events
      getCallData = function(dialog){

        var callVars    = dialog.getMediaProperties(),
            callData = {
              DNIS        : callVars.DNIS,
	      callType    : callVars.callType,
              callId      : dialog.getId(),
	      fromAddress : dialog.getFromAddress(),
	      toAddress   : dialog.getToAddress(),
              callState   : dialog.getState(),
              extension   : user.getExtension()
            };

        clientLogs.log("Got the call data for callId: " + callData.callId + " callState:" + callData.callState);

        callId = callData.callId;
        restObj._test(callData.callId);
        //restObj._tagCall(baseUrl, "/calls", callData);

      },


      _getExtensionNumber = function(){

        return user.getExtension();

      },

      _processCall = function(dialog){
        clientLogs.log('In _processCall');

        clientLogs.log('Call State ----------------------------' + dialog.getState() );

        //alert('_processCall STATE: ' + dialog.getState() + ' DIALOGS: ' +  dialogs.getDialogCount() );

        getCallData(dialog);

      },

      /**
       *  Handler for additions to the Dialogs collection object.  This will occur when a new
       *  Dialog is created on the Finesse server for this user.
       */

      handleNewDialog = function(dialog){
        // call the displayCall handler
        clientLogs.log('In handleNewDialog.');

        $("#contactId").text('current call');

        //alert('STATE: ' + dialog.getState() + ' DIALOGS: ' +  dialogs.getDialogCount() );

        getCallData (dialog);

        // add a dialog change handler in case the callvars didn't arrive yet
        dialog.addHandler('change', _processCall(dialog));
        dialog.addHandler('delete', handleEndDialog(dialog));

      },

      /**
       *  Handler for deletions from the Dialogs collection object for this user.  This will occur
       *  when a Dialog is removed from this user's collection (example, end call)
       */

      handleEndDialog = function(dialog){

        clientLogs.log('In handleEndDialog..');
        //alert( dialog.getState() );

        clientLogs.log('>>>>>>>>>>>>>>>>  STATE: ' + dialog.getState() + ' DIALOGS: ' +  dialogs.getDialogCount() );


        setTimeout(_getLastContacts(),3500);




        getCallData(dialog);



      },

      _handleDialogsLoaded = function(dialog){
          //alert('_handleDialogsLoaded STATE: ' + dialog.getState() + ' DIALOGS: ' +  dialogs.getDialogCount() );

      },

      /**
       * Handler for the onLoad of a User object.  This occurs when the User object is initially read
       * from the Finesse server.  Any once only initialization should be done within this function.
       */

      handleUserLoad = function(userevent){
        // Get an instance of the dialogs collection and register handlers for dialog additions and
        // removals
        clientLogs.log('In handleUserLoad.');
        dialogs = user.getDialogs( {
          onCollectionAdd    : handleNewDialog,
          onCollectionDelete : handleEndDialog,
          onLoad : _handleDialogsLoaded
        });


        _getLastContacts();



        clientLogs.log('Extension num: ' + user.getExtension());

        var extension    = $('#datastore01').attr('data-extension').val('12345');
        var extension01  = $('#datastore01').attr('data-extension');

        clientLogs.log("THE EXTENSION IS: " + extension01 );


        //extensionNum = user.getExtension();

      },

      handleUserChange = function(userevent){
        // Get an instance of the dialogs collection and register handlers for dialog additions and
        // removals
        clientLogs.log('In handleUserChange.');
        //_getLastContacts();

      },

      // Get last nth contacts (recording data) from the AQM server
      //  the user object is only visible here !!
      _getLastContacts = function(){

        clientLogs.log("-------IN getLastContacts ------ " );
        var jsonData = { extension: user.getExtension(),
                         limit:     5},
            handlers = { success: '_handlerGetLastCallsSuccess',
                         error:   '_handlerGetLastCallsError'};

        clientLogs.log('getLastContacts for extension: ' + jsonData.extension);

        restObj._httpRequest('GET',baseUrl,'/getLastContacts',jsonData,handlers);
      };


  /** @scope finesse.modules.CallLoggingGadget

      This methods can be called from the gadget javascript code or wired
      to events on the gadget html code.
   */

  return {

    // Get the handlebars template for the html table showing the calls
    // we just make a plain GET request, no data sent here.
    // This way we can have indpendent xml files for the gadget boilerplate
    // and the gadget HTML user interface.
    getHtmlTableTemplate: function(){
      var  handlers    = { success: '_handlerGetHtmlTableTemplateSuccess',
                           error:   '_handlerGetHtmlTableTemplateError' };

      restObj._httpRequest('GET',baseUrl,'/html/tableTemplate.html',null,handlers);

    },


    // this does not work !!  user object not visible here !!
    getLastContacts: this.getLastContacts,
        // Get last nth contacts (recording data) from the AQM server
    _getLastContacts: function(){

      clientLogs.log("-------IN getLastContacts ------ " );
      var jsonData = { extension: 16698,
                       limit:     5},
          handlers = { success: '_handlerGetLastCallsSuccess',
                       error:   '_handlerGetLastCallsError'};

      clientLogs.log('getLastContacts for: ' + jsonData.extension);

      restObj._httpRequest('GET',baseUrl,'/getLastContacts',jsonData,handlers);
    },

    /**
       Set the ticket number for specific call
       We just send the ticket number here. The backend server takes care of which case we
       have, either we have an active call or we don't have an active call
       and previous calls have been logged.
    */
    setTicketNumber: function(){

      var jsonData = { ticketNum : $('#ticketnumber').val().trim(),
                       contactId : $('#contactId').text().trim(),
                       extension : user.getExtension(),
                       state     : user.getState(),
                       callId    : callId
                     },
          handlers = { success: '_handlerSetTicketNumberSuccess',
                       error:   '_handlerSetTicketNumberError'};

      if (jsonData.ticketNum.length !== 0) {
        clientLogs.log('setTicketNumber ticketNum:' + jsonData.ticketNum + ' contactId:' + jsonData.contactId + 'len:' + jsonData.ticketNum.length);

        restObj._httpRequest('POST',baseUrl,'/tickets',jsonData,handlers);
      };
    },

    /**
    *   Assign this function to an event handler on the HTML file
    */
    getTicket: function(){

      var data  =  { ticketNum : $('#ticketNum').val(),
                     extension : user.getExtension(),
                     state     : user.getState(),
                     callId    : callId
                   };

      clientLogs.log('Got ticketNum:' + data.ticketNum);

      restObj.__tagCall(baseUrl, "/tickets", data);

    },

    testMe: function(){
      clientLogs.log("------TEST ME-------");
    },


    /**
     * Performs all initialization for this gadget
     * Gets prefs from the gadget xml definition file
     */

    init: function(){

      var prefs =  new gadgets.Prefs(),
	  id = prefs.getString("id"),
          baseUrl  = 'http://' + prefs.getString("gadgetServerHost") + ':' + prefs.getString("gadgetServerPort"),

          clientLogs = finesse.cslogger.ClientLogger,
          _util = finesse.utilities.Utilities;

      //gadgets.window.adjustHeight();

      // Initiate the ClientServices.  ClientServices are
      // initialized with a reference to the current configuration.

      finesse.clientservices.ClientServices.init(finesse.gadget.Config);
      clientLogs.init(gadgets.Hub, "CallLoggingGadget");
      clientLogs.log("In init.");



      uiObj   = new _ui();
      uiObj._alive();



      // Initialize external object that contains REST funcionality
      // The contained functions interact with the gadgets object
      // Pass a reference to the gadget itself as 'this'
      restObj = new _rest();
      restObj._init(gadgets,_util,uiObj,this);

      // Get the template for the html table
      this.getHtmlTableTemplate();

      clientLogs.log("Testing restObj ...");
      restObj._alive();
      clientLogs.log("restObj ver: " + restObj._ver);


      // Init the finesse user object

      user = new finesse.restservices.User({
        id: id,
        onLoad   : handleUserLoad,
        onChange : handleUserChange
      });


      //alert('hola');
      //alert(this.xinspect(user));
      //clientLogs.log('T-----------  user: ' + user );

      //this.extensionNum = user.getExtension();




      // Get initial data from server
      //this.getLastContacts();

      //this.testMe();

      //alert(user);

      //this._getProps(user);
      //alert(this.xinspect(user));
      //console.log(user);
      //console.log('-----------------------------------------HOLA MUNDO');
      //console.log('user obj: ' + user);

      //clientLogs.log('---------------------------------------------Extension: ' + user.getExtension());

      states = finesse.restservices.User.States;

      // Initiate the ContainerServices and add a handler for when the tab is visible
      // to adjust the height of this gadget in case the tab was not visible
      // when the html was rendered (adjustHeight only works when tab is visible)

      containerServices = finesse.containerservices.ContainerServices.init();
      containerServices.addHandler(finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB, function() {
	clientLogs.log("Gadget is now visible");
	// automatically adjust the height of the gadget to show the html
	gadgets.window.adjustHeight();
      });
      containerServices.makeActiveTabReq();



    }
  };
}(jQuery));
