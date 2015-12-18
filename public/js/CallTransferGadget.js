/*
*   CallTransferGadget 
*
*


<Dialog><targetMediaAddress>16698</targetMediaAddress><requestedAction>ANSWER</requestedAction></Dialog>

requestId=21ac43b1-4406-46c3-8c5b-d2d964cd0158&Content-Type=application%2Fxml&Authorization=Basic%20dGVzdDAxOjEyMzQ1&locale=en_US
<Dialog><targetMediaAddress>16698</targetMediaAddress><toAddress>111</toAddress><requestedAction>CONSULT_CALL</requestedAction></Dialog>
http://localhost:8082/finesse/api/Dialog/18396595

requestId=74749175-78b6-47df-ab73-f575dfc72ef0&Content-Type=application%2Fxml&Authorization=Basic%20dGVzdDAxOjEyMzQ1&locale=en_US
<Dialog><targetMediaAddress>16698</targetMediaAddress><requestedAction>TRANSFER</requestedAction></Dialog>
http://localhost:8082/finesse/api/Dialog/18396595


<Dialog><targetMediaAddress>16698</targetMediaAddress><toAddress>111</toAddress><requestedAction>CONSULT_CALL
</requestedAction></Dialog>
http://localhost:8082/finesse/api/Dialog/18425329

<Dialog><targetMediaAddress>16698</targetMediaAddress><requestedAction>TRANSFER</requestedAction></Dialog>
http://localhost:8082/finesse/api/Dialog/18425329

11:37:40.893 -0500: CallTransferGadget : _completeTransferError()
11:37:40.893 -0500: CallTransferGadget : _completeTransferError() - errorType: Invalid State
11:37:40.894 -0500: CallTransferGadget : _completeTransferError() - errorMessage: No Active call available on agent for TRANSFER


_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: ACD_IN
_processCall(): Process the dialog with id: 18527024, to extension: null, from extension: 16698,          call state: INITIATING, callType: CONSULT
_processCall(): Process the dialog with id: 18527024, to extension: 7772, from extension: 16698,          call state: INITIATED,  callType: CONSULT
_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: TRANSFER


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
finesse.modules.CallTransferGadget = (function ($) {
   
  var user, dialogs, states, callId, sysInfo, _dialog, dialogActions, originalCallDialog, consultCallDialog, 
      // Get custom paramaters from the Prefs defined at the gadget XML definition file
      prefs         =  new gadgets.Prefs(),
      baseUrl       = 'http://' + prefs.getString("gadgetServerHost") + ':' + prefs.getString("gadgetServerPort"),
      vxmlBaseUrl   = 'http://' + prefs.getString("vxmlServerHost")   + ':' + prefs.getString("vxmlServerPort"),
      vxmlAppPath   = prefs.getString("vxmlServerPath"),
      vxmlUrl       = vxmlBaseUrl + vxmlUrl,
      transferDirn  = prefs.getString("transferDirn"),

      transferToExtension = transferDirn,

      NO_MSG_HEIGHT = 30,

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

         clientLogs.log("Got the call data for callId: " + callData.callId + " callState:" + callData.callState + " ani: " + callData.fromAddress); 

        return callData;
        //callId = callData.callId;
        //restObj._test(callData.callId);
        //restObj._tagCall(baseUrl, "/calls", callData);
        
      },


      // Dialog and User event handlers -----------------------------------------------------------------
      
      /**
       *  Handler for additions to the Dialogs collection object.  This will occur when a new
       *  Dialog is created on the Finesse server for this user.
       */

      handleNewDialog = function(dialog){

        clientLogs.log('In handleNewDialog.');
        //getCallData(dialog);

      },
     
      /**
       *  Handler for deletions from the Dialogs collection object for this user.  This will occur
       *  when a Dialog is removed from this user's collection (example, end call)
       */

      handleEndDialog = function(dialog){
      
        clientLogs.log('In handleEndDialog..');
        clientLogs.log('>>>>>>>>>>>>>>>>  STATE: ' + dialog.getState() + ' DIALOGS: ' +  dialogs.getDialogCount() );
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

        clientLogs.log('Extension num: ' + user.getExtension());

        var extension    = $('#datastore01').attr('data-extension').val('12345');
        var extension01  = $('#datastore01').attr('data-extension');

        clientLogs.log("THE EXTENSION IS: " + extension01 );

       
      },

      handleUserChange = function(userevent){
        // Get an instance of the dialogs collection and register handlers for dialog additions and
        // removals
        clientLogs.log('In handleUserChange.');
        //_getLastContacts();

      },


      /**
       *  Handler for additions to the Dialogs collection object.  This will occur when a new
       *  Dialog is created on the Finesse server for this user.
       */
      _handleDialogAdd = function(dialog) {
        
        // Call data for the current call
        var callData = getCallData(dialog);

	clientLogs.log (" handleDialogAdd() - dialog.getId(): " + dialog.getId());
        //clientLogs.log("Current Timestamp: " + sysInfo.getCurrentTimestamp());
        // Really need to handle this a little better...but this is just a sample.  This doesn't handle multiple calls properly.		
	_dialog = dialog;
        		
        clientLogs.log("Dialog handled : " + _dialog.getId());
        var callType = _dialog.getMediaProperties().callType;
        clientLogs.log("CallType:" + callType);

        // Try transfer after consult call
        if (callType === "CONSULT"){

          consultCallDialog = dialog;

          completeTransfer(consultCallDialog);
     
        // Incoming Call
        } else if (callType==="OTHER_IN"){

          originalCallDialog = dialog;       

        } else if (callType==="ACD_IN"){

          originalCallDialog = dialog;

        };

      },
     
      /**
       *  Handler for deletions from the Dialogs collection object for this user.  This will occur
       *  when a Dialog is removed from this user's collection (example, end call)
       */
      _handleDialogDelete = function(dialog) {
	clientLogs.log(" handleDialogDelete() - dialog.getId(): " + dialog.getId());
	//clientLogs.log("Current Timestamp: " + sysInfo.getCurrentTimestamp());	

        if (dialog.getId() === _dialog.getId()) {
	  _dialog = null;
	} else {
	  clientLogs.log ("_handleDialogDelete() - Last Dialog added had Id of: " + 
                          _dialog.getId() + ", so not clearing Dialog reference for: " + dialog.getId());	
	}

      },
	
      /**
       * Handler for when GET Dialogs has loaded
       *
       */
      _handleDialogsLoaded = function() {
  	clientLogs.log ("_handleDialogsLoaded()");

        var dialogCollection, dialogId;
        //Render any existing dialogs
        dialogCollection = dialogs.getCollection();
        for (dialogId in dialogCollection) {
          if (dialogCollection.hasOwnProperty(dialogId)) {
            _handleDialogAdd(dialogCollection[dialogId]);
          }
        }
      },

      
	
      /**
       * Handler for the onLoad of a User object.  This occurs when the User object is initially read
       * from the Finesse server.  Any once only initialization should be done within this function.
       */
      _handleUserLoad = function (userevent) {
	clientLogs.log ("_handleUserLoad()");

        // Get an instance of the dialogs collection and register handlers for dialog additions and
        // removals
        dialogs = user.getDialogs( {
          onCollectionAdd    : _handleDialogAdd,
          onCollectionDelete : _handleDialogDelete,
	  onLoad : _handleDialogsLoaded
        });
         
     
      },

      // CallTransfer, Dialogs -----------------------------------------------------------------------------------------------
      
      

      /**
       * Try to transfer call
       */

      completeTransfer = function (dialog) {
        clientLogs.log ("completeTransfer(). Original Call Dialog: " + originalCallDialog );
      
        if (originalCallDialog  === null) {
	  clientLogs.log("No Dialog to complete call transfer on.");
	  return;	//code
        }
      
        clientLogs.log("Completing transfer call  on Dialog: " + originalCallDialog.getId() 
                       + " Extension: "   + user.getExtension()
                       + " Destination: " + transferToExtension + " Action: " + finesse.restservices.Dialog.Actions.TRANSFER 
                       + " Dialogs: "     + _getDialogCount() );
      
        dialog.requestAction(
          user.getExtension(),
	  finesse.restservices.Dialog.Actions.TRANSFER,
	  {
	    success : _completeTransferSuccess,
	    error   : _completeTransferError
	  });

      },

      /**
       * Returns the count of Dialogs from the Dialogs Collection
       */

      _getDialogCount = function() {
	var count = 0;
        var dialogCollection, dialogId;

        dialogCollection = dialogs.getCollection();

	for(dialogId in dialogCollection) {
	  if(dialogCollection.hasOwnProperty(dialogId))
	    ++count;
	}
	return count;		
      },

      _getContacts = function(){
        var dialogCollection, dialogId;

        dialogCollection = dialogs.getCollection();
        for (dialogId in dialogCollection) {
          if (dialogCollection.hasOwnProperty(dialogId)) {
            clientLogs.log("DIALOG ID: " + dialogId);
          }
        }
      },


      _postReferral = function(callData){
    
        // Thi should complete before the transferred call is answered on the IVR

        clientLogs.log("-------IN postReferral ------ " );

        var jsonData = { originalAni: callData.fromAddress,
                         ani:         callData.extension},

            handlers = { success: '_handlerSuccessGeneric',
                         error:   '_handlerErrorGeneric'};

        clientLogs.log('GET referral for originalAni: ' + jsonData.originalAni + 'ani: ' + jsonData.ani );

        //   Post Referral
        //   originalAni=ani (randomId))
        //   ani=extension

        restObj._httpRequest('GET',vxmlBaseUrl,vxmlAppPath,jsonData,handlers);
      },


      // Success / Error Callbacks ------------------------------------------------------------------------------------------ 
  
      _consultCallSuccess = function(rsp){

        var delay    = 1000,
            callData = getCallData(originalCallDialog);

        clientLogs.log("_consultCallSuccess() delay:" + delay );
        clientLogs.log("callData: " + callData);
        //_getContacts();

         _postReferral(callData);

        // Try call transfer
         window.setTimeout(completeTransfer(),delay);
      },

      _consultCallError = function(rsp){
        clientLogs.log("_consultCallError()");
      },

      /**
       * Handler for successful transfer.
       */
      _startCallTransferSuccess = function(rsp) {
	clientLogs.log ("_startCallTransferSuccess()");
        
	$('#successMsg').fadeIn("slow");
		
        gadgets.window.adjustHeight();
		
	window.setTimeout(function () {
	  $('#successMsg').fadeOut("slow",0, function() {gadgets.window.adjustHeight(NO_MSG_HEIGHT);});
	}, 4000);			
      },
    
      /**
       * Handler for makeCall when error occurs.
       */
      _startCallTransferError = function(rsp) {
	clientLogs.log ("_startCallTransferError()");
	
	var errorType    = rsp.object.ApiErrors.ApiError.ErrorType;
	var errorMessage = rsp.object.ApiErrors.ApiError.ErrorMessage;
	
	clientLogs.log ("_startCallTransferError() - errorType: " + errorType);
	clientLogs.log ("_startCallTransferError() - errorMessage: " + errorMessage);
	
	$('#errorMsgType').text(errorType);
	$('#errorMsgMessage').text(errorMessage);
	
	$('#errorMsg').fadeIn("slow");
		
        gadgets.window.adjustHeight();
		
	window.setTimeout(function () {
	  $('#errorMsg').fadeOut("slow",0, function() {gadgets.window.adjustHeight(NO_MSG_HEIGHT);});
	}, 4000);		
      },

      _completeTransferSuccess = function(rsp){
        clientLogs.log("_completeTransferSuccess()");
        //   originalAni=ani (randomId))
        //   ani=extension

        var callData = getCallData(originalCallDialog);

    
        clientLogs.log("callData: " + callData);
        //_getContacts();

        //_postReferral(callData);
       
      },

      _completeTransferError = function(rsp){
        clientLogs.log("_completeTransferError()");

        var errorType    = rsp.object.ApiErrors.ApiError.ErrorType;
	var errorMessage = rsp.object.ApiErrors.ApiError.ErrorMessage;
	
	clientLogs.log ("_completeTransferError() - errorType: " + errorType);
	clientLogs.log ("_completeTransferError() - errorMessage: " + errorMessage);

	completeTransfer(originalCallDialog);

      };
      
  // The Gadget ----------------------------------------------------------------------------------------------

  /** @scope finesse.modules.CallLoggingGadget 

      This methods can be called from the gadget javascript code or wired 
      to events on the gadget html code.
   */

  return {

    

    testMe: function(){
      clientLogs.log("------TEST ME-------");
    },
     
    transfer: function(){
      
      clientLogs.log("Current Timestamp: " + sysInfo.getCurrentTimestamp());
 
      clientLogs.log("++++++++ Call Transfer Test +++++++++");
    },
  
    /**
     * Try to transfer call
     */
    startTransfer : function () {
      clientLogs.log ("startTransfer()");
      
      if (_dialog === null) {
	clientLogs.log("No Dialog to start consult call on.");
	return;	//code
      }
      
      clientLogs.log("Starting consult call on Dialog: " + _dialog.getId() 
                     + " Extension: "   + user.getExtension()
                     + " Destination: " + transferToExtension);
      
      _dialog.makeConsultCall(
        user.getExtension(),
	transferToExtension,
	{
	  success : _consultCallSuccess,
	  error   : _consultCallError
	});				
    },

    /**
     * Performs all initialization for this gadget
     * Gets prefs from the gadget xml definition file
     */

    init: function(){

      var prefs =  new gadgets.Prefs(),
	  id = prefs.getString("id"),
          baseUrl     = 'http://' + prefs.getString("gadgetServerHost") 
                        + ':' + prefs.getString("gadgetServerPort"),
          clientLogs  = finesse.cslogger.ClientLogger,
          finesseUtil = finesse.utilities.Utilities;

      //gadgets.window.adjustHeight();
      
      // Initiate the ClientServices.  ClientServices are
      // initialized with a reference to the current configuration.

      finesse.clientservices.ClientServices.init(finesse.gadget.Config);
      clientLogs.init(gadgets.Hub, "CallTransferGadget"); 
      clientLogs.log("In init.");
      
      _dialog = null;


      // Initialize external object that contains REST funcionality
      // The contained functions interact with the gadgets object
      // Pass a reference to the gadget itself as 'this'
      restObj = new _rest();
      restObj._init(gadgets,finesseUtil,uiObj,this);

      clientLogs.log("Testing restObj ...");
      restObj._alive();
      clientLogs.log("restObj ver: " + restObj._ver);

      // Init the finesse user object

      user = new finesse.restservices.User({
        id: id,
        onLoad   : _handleUserLoad,
        onChange : handleUserChange
      });
      
      states = finesse.restservices.User.States;
      dialogActions = finesse.restservices.Dialog.Actions();


      

			
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
