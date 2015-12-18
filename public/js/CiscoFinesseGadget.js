/*
_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: ACD_IN
_processCall(): Process the dialog with id: 18527024, to extension: null, from extension: 16698,          call state: INITIATING, callType: CONSULT
_processCall(): Process the dialog with id: 18527024, to extension: 7772, from extension: 16698,          call state: INITIATED,  callType: CONSULT
_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: TRANSFER

CiscoFinesseGadget : _completeTransferError() {"status":400,"content":"<ApiErrors>\n  <ApiError>\n    <ErrorType>Invalid State</ErrorType>\n    <ErrorData></ErrorData>\n    <ErrorMessage>No Active call available on agent for TRANSFER</ErrorMessage>\n  </ApiError>\n</ApiErrors>","object":{"ApiErrors":{"ApiError":{"ErrorType":"Invalid State","ErrorData":null,"ErrorMessage":"No Active call available on agent for TRANSFER"}}}}

2015-12-16T01:15:56.039 -06:00: : ?.?.?.?: Dec 16 2015 01:14:40.048 -0600: CiscoFinesseGadget : _completeTransferError() {"content":"<content>/finesse/api/User/test01/Dialogs<Update>\n  <data>\n    <apiErrors>\n      <apiError>\n        <errorData>4047</errorData>\n        <errorMessage>INVALID_ACTION TRANSFER on extension 16698</errorMessage>\n        <errorType>Generic Error</errorType>\n      </apiError>\n    </apiErrors>\n  </data>\n  <event>put</event>\n  <requestId>025376c1-1906-4a3e-8fc9-2659d64ebbf1</requestId>\n  <source>/finesse/api/Dialog/19226673</source>\n</Update></content><object>\t<Update>\t\t<data>\t\t\t<apiErrors>\t\t\t\t<apiError>\t\t\t\t\t<errorData>4047</errorData>\t\t\t\t\t<errorMessage>INVALID_ACTION TRANSFER on extension 16698</errorMessage>\t\t\t\t\t<errorType>Generic Error</errorType></apiError></apiErrors></data>\t\t<event>put</event>\t\t<requestId>025376c1-1906-4a3e-8fc9-2659d64ebbf1</requestId>\t\t<source>/finesse/api/Dialog/19226673</source></Update></object>","object":{"ApiErrors":{"ApiError":{"ErrorData":"4047","ErrorMessage":"INVALID_ACTION TRANSFER on extension 16698","ErrorType":"Generic Error"}}},"status":400}

Google Gadgets API
https://developers.google.com/gadgets/docs/overview

Cisco Finesse API
https://developer.cisco.com/site/finesse/

finesse.restservices.User()
 getState()
 hasAgentRole()
 hasSupervisorRole()
 getTeamId()
 getTeamName()
 getExtension()
 getFirstName()
 getLastName()
 getQueues()

finesse.restservices.Queue()
 getId()
 getName()
 getStatistics().callsInQueue
 getStatistics().startTimeOfLongestCallInQueue

Init Steps:

  init() -> _handleUserLoad() -> _handleDialogsLoaded()

State changes (ready/not ready):
  _handleUserChange()

Incoming Call
  _handleUserChange()

callVariable2

*/

var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
var clientLogs = finesse.cslogger.ClientLogger || {};

// Closure to ReactJs
var globalVar = {};

// Gadget Config needed for instantiating ClientServices
/** @namespace */
finesse.gadget.Config = (function () {
  var _prefs = new gadgets.Prefs();

  /** @scope finesse.gadget.Config */
  return {
    authorization: _prefs.getString('authorization'),
    country: _prefs.getString('country'),
    language: _prefs.getString('language'),
    locale: _prefs.getString('locale'),
    host: _prefs.getString('host'),
    hostPort: _prefs.getString('hostPort'),
    extension: _prefs.getString('extension'),
    mobileAgentMode: _prefs.getString('mobileAgentMode'),
    mobileAgentDialNumber: _prefs.getString('mobileAgentDialNumber'),
    xmppDomain: _prefs.getString('xmppDomain'),
    pubsubDomain: _prefs.getString('pubsubDomain'),
    restHost: _prefs.getString('restHost'),
    scheme: _prefs.getString('scheme'),
    localhostFQDN: _prefs.getString('localhostFQDN'),
    localhostPort: _prefs.getString('localhostPort'),
    clientDriftInMillis: _prefs.getInt('clientDriftInMillis')
  };
}());

/** @namespace */
finesse.modules = finesse.modules || {};
finesse.modules.CiscoFinesseGadget = (function ($,_REST) {

  var user, dialogs, states, dialogActions,     // Finesse Objects
      dialogAcd, dialogConsult,                 // Gadget specific objects
      callId, sysInfo,
      // Get custom paramaters from the Prefs defined at the gadget XML definition file
      prefs         =  new gadgets.Prefs(),
      baseUrl       = 'http://' + prefs.getString('gadgetServerHost') + ':' + prefs.getString('gadgetServerPort'),
      vxmlBaseUrl   = 'http://' + prefs.getString('vxmlServerHost')   + ':' + prefs.getString('vxmlServerPort'),
      vxmlAppPath   = prefs.getString('vxmlServerPath'),
      vxmlUrl       = vxmlBaseUrl + vxmlUrl,
      transferDirn  = prefs.getString('transferDirn'),

      transferToExtension = transferDirn,

      // Bridge to ReactJS state object
      callState = {acdIncomingCall: false,
                   acdCallUsername: '',
                   acdCallUserid:   ''},

      // ReactJS application
      _getReactApp = function(){
         return React.createElement(TransferButton, {callState:callState,onClick: _reactCbk,baseUrl:baseUrl});
      },

      NO_MSG_HEIGHT = 30,

      // Dialogs
      // Dialog and user event handlers
      // Finesse Call  Control
      // Server Side Backend Interaction
      // Call control success/error callbacks
      // Server Side Backend success/error callbacks

      // Dialogs -----------------------------------------------------------------------------------------

      _getCallData = function(dialog){
        if (dialog) {
          var   callVars    = dialog.getMediaProperties(),
                callData = {
                 DNIS        : callVars.DNIS,
	               callType    : callVars.callType,
                 callId      : dialog.getId(),
	               fromAddress : dialog.getFromAddress(),
	               toAddress   : dialog.getToAddress(),
                 callState   : dialog.getState(),
                 extension   : user.getExtension()
               };

          clientLogs.log("Call Variables: " + JSON.stringify(callVars));

            //clientLogs.log('_getCallData(). callId: ' + callData.callId + ' Type: ' + callData.callType +
            //               ' callState:' + callData.callState + ' ani: ' + callData.fromAddress);
          return callData;
        } else {
          clientLogs.log('Dialog is null/undefined.');
        }
      },

      // Dialog and User event handlers -----------------------------------------------------------------
      // We care only about ACD_IN and CONSULT calls, ignore any other type of calls

      // This will occur when a new Dialog is added to the user's collection (new call)
      _handleNewDialog = function(dialog) {
        clientLogs.log('In handleNewDialog.');
      },

      // This will occur when a Dialog is removed from this user's collection (example, end call)
      _handleEndDialog = function(dialog) {
        clientLogs.log('In handleEndDialog..');
      },

      // Handler for additions to the Dialogs collection object.  This will occur when a new
      // Dialog is created on the Finesse server for this user.
      _handleDialogAdd = function(dialog) {
        var callType = _getCallData(dialog).callType;

        if (dialog && callType==='ACD_IN' && dialogAcd==null){
          dialogAcd = dialog;
          clientLogs.log('_handleDialogAdd(). Dialog add Ok: ' + dialog.getId()  + ' Type: ' + callType);

          // Notify ReactJS state
          var callVars = dialog.getMediaProperties();
          callState['acdIncomingCall'] = true;
          callState['acdCallUsername'] = callVars.callVariable3;
          callState['acdCallUserid']   = callVars.callVariable4;

          clientLogs.log('The callState: ' + JSON.stringify(callState));

          // Callback to ReactJs
          globalVar.reactCallback(callState);

        } else if (dialog && callType==="CONSULT" && dialogConsult==null){
          dialogConsult = dialog;
          clientLogs.log('_handleDialogAdd(). Dialog add Ok: ' + dialog.getId()  + ' Type: ' + callType);
          dialogConsult.addHandler('change', _handleDialogsChanged);

        } else {
          clientLogs.log('_handleDialogAdd(). Invalid dialog: ' + dialog.getId() + ' Type: ' + callType);
        }
      },

      // This will occur when a Dialog is removed from the Dialogs collection (example, end call)
      _handleDialogDelete = function(dialog) {
        var callType = _getCallData(dialog).callType;

        if (dialog!==null && callType==='ACD_IN' && dialogAcd!==null){
          dialogAcd = null;
          clientLogs.log('_handleDialogDelete(). Dialog delete Ok: ' + dialog.getId()  + ' Type:'  + callType);

          // Notify ReactJS state
          callState['acdIncomingCall'] = false;
          callState['acdCallUsername'] = '';
          callState['acdCallUserid']   = '';

          // Callback to ReactJs
          globalVar.reactCallback(callState);

        } else if (dialog!==null && callType==="CONSULT" && dialogConsult!==null){
          dialogConsult = null;
          clientLogs.log('_handleDialogDelete. Dialog delete Ok: ' + dialog.getId()  + ' Type: ' + callType);
        } else {
          clientLogs.log('_handleDialogDelete(). Invalid dialog delete: ' + dialog.getId() + ' Type: ' + callType);
        }
      },

      _handleDialogsLoaded = function() {
  	     clientLogs.log ('_handleDialogsLoaded()');
         var dialogCollection, dialogId;
         //Render any existing dialogs
         dialogCollection = dialogs.getCollection();
         for (dialogId in dialogCollection) {
           if (dialogCollection.hasOwnProperty(dialogId)) {
             _handleDialogAdd(dialogCollection[dialogId]);
           }
         }
      },

      _handleDialogsChanged = function() {
        clientLogs.log('_handleDialogsChanged()');
        var dialogCollection = dialogs.getCollection();

        for (dialogId in dialogCollection) {
          if (dialogCollection.hasOwnProperty(dialogId)) {
             var dialog   = dialogCollection[dialogId],
                 callData = _getCallData(dialog);
             if (callData.callType==="CONSULT" && callData.callState=="ACTIVE") {
                 clientLogs.log('_handleDialogsChanged. CONSULT call is ACTIVE');
                 _startConsultCallSuccess(null);
             }
          }
        }
      },

      // Handler for the onLoad of a User object.  This occurs when the User object is initially read
      // from the Finesse server.  Any once only initialization should be done within this function.
      _handleUserLoad = function(userevent) {
	      clientLogs.log ('_handleUserLoad()');

        // Get an instance of the dialogs collection and register handlers for dialog additions and removals
        dialogs = user.getDialogs( {
             onCollectionAdd    : _handleDialogAdd,
             onCollectionDelete : _handleDialogDelete,
	           onLoad :  _handleDialogsLoaded,
             onChange: _handleDialogsChanged
        });
      },

      _handleUserChange = function(userevent) {
        clientLogs.log('_handleUserChange()');
      },

      // Finesse Call Control ---------------------------------------------------------------------------------

      // Initiate call transfer for current incoming ACD call
      // dialog:  ACD In dialog
      // todo No dialog
      _startCallTransfer = function(dialog,user){
        var handlers = {success: _dummy, error: _startConsultCallError},
            callType = _getCallData(dialog).callType,
            dirn     = user.getExtension();

        clientLogs.log('_startCallTransfer()');

        // Do we have an incoming valid ACD call, ie ignore silent monitor calls, consult calls, etc.
        if (dialog!==null && callType==='ACD_IN') {
            clientLogs.log('_startCallTransfer(). Starting consult call. Dialog: ' + dialog.getId() +
                           ' Ext num: ' + dirn + ' Xfer num: ' + transferDirn);
            dialog.makeConsultCall(dirn,transferDirn,handlers);
        } else {
            var msg = 'Invalid dialogs on _startCallTransfer().';
            clientLogs.log(msg);
            handlers.error({status: 500, content: msg});
            return;
        }
      },

      //  dialog:    Consult call dialog
      _completeCallTransfer = function(dialog){
        var handlers = {success: _completeTransferSuccess, error: _completeTransferError},
            callData = _getCallData(dialog);
            dirn     = user.getExtension(),
            excludeSilentMonitor = true,
            TRANSFER = finesse.restservices.Dialog.Actions.TRANSFER;


        clientLogs.log('Dialog:' + dialog + ' Num dialogs:' + dialogs.getDialogCount(excludeSilentMonitor) +
                        ' True? ' + (dialogs.getDialogCount(excludeSilentMonitor)==2) + ' State:' + callData.callState );

        // We must have exactly 2 calls excluding silent monitor calls
        if (dialog && (dialogs.getDialogCount(excludeSilentMonitor)==2) ) {
           clientLogs.log('_completeCallTransfer(). Completing transfer call on Dialog: ' + dialog.getId() +
                          ' Extension: '   + dirn +
                          ' Destination: ' + transferDirn + " Action: " + TRANSFER +
                          ' Dialogs: '     + dialogs.getDialogCount(excludeSilentMonitor));
           dialog.requestAction(dirn,TRANSFER,handlers);
        } else {
           var msg = 'Invalid dialogs on _completeCallTransfer().';
           clientLogs.log(msg);
           handlers.error({status: 500, content: msg});
           return;
        }
      },

      // Server side backend interaction ---------------------------------------------------------------------

      _postReferral = function(callData){
        // This should complete before the transferred call is answered on the IVR
        clientLogs.log('postReferral()');
        var jsonData = { originalAni: callData.fromAddress,   // orginalAni=ani (randomId)
                         ani:         callData.extension},
            handlers = { success: _postReferralSuccess, error: _postReferralError};

        _REST.httpRequest('GET',vxmlBaseUrl,vxmlAppPath,jsonData,handlers);
      },

      // Tag call with ticket number. Include contactid for previously recorded calls
      // or leave it alone to refer to the current call.
      _setTicketNumber = function(ticketnumber,contactid,callid){
        var callData = _getCallData(dialog);

        var jsonData = { ticketNum : ticketnumber.trim(),
                         extension : user.getExtension(),
                         state     : user.getState(),
                         callId    : callData.callId
                       },
            handlers = { success: _setTicketNumberSuccess, error: _setTicketNumberError};

        if (jsonData.ticketNum.length !== 0) {
          clientLogs.log('_setTicketNumber(). ticketNum:' + jsonData.ticketNum + ' callId:' + jsonData.callId);
          _REST.httpRequest('POST',baseUrl,'/tickets',jsonData,handlers);
        }
      },

      _getLastContacts = function(){

        var jsonData = { extension: user.getExtension(),
                         limit:     5},
            handlers = { success: _getLastContactsSuccess,
                         error:   _getLastContactsError};

        clientLogs.log('_getLastContacts().  Extension:' + jsonData.extension);

        _REST.httpRequest('GET',baseUrl,'/getLastContacts',jsonData,handlers);
      },

      // Call Control Success / Error Callbacks --------------------------------------------------------------

      _startConsultCallSuccess = function(rsp) {
	       clientLogs.log ('_startConsultCallSuccess() ' + dialogConsult);
         var delay    = 2000,
             dialog   = dialogAcd,
             callData = _getCallData(dialogAcd);

         // Refer the call (post to database) before transferring to final destination
         _postReferral(callData);
         setTimeout(_completeCallTransfer(dialog),delay);
      },

      // dialog: originalCallDialog
      _startConsultCallError = function(rsp) {
	       clientLogs.log ('_startConsultCallError() ' + rsp);
      },

      _completeTransferSuccess = function(rsp){
        clientLogs.log('_completeTransferSuccess()');
        dialogAcd=null;
        dialogConsult=null;
      },

      _completeTransferError = function(rsp){
        clientLogs.log('_completeTransferError() ' + JSON.stringify(rsp) );
      },

      // Server side success/error callbacks ------------------------------------------------------------------

      _setTicketNumberSuccess = function(rsp) {
        clientLogs.log('_setTicketNumberSuccess()');
      },

      _setTicketNumberError = function(rsp) {
        clientLogs.log('_setTicketNumberError()');
      },

      _postReferralSuccess = function(rsp) {
        clientLogs.log('_postReferralSuccess()');
      },

      _postReferralError = function(rsp) {
        clientLogs.log('_postReferralError');
      },



      // ReactJs callback TEMP !!!!
      _reactCbk  = function(e){
        clientLogs.log('React callback...');
        _startCallTransfer(dialogAcd,user);
      },

      _dummy = function(e) {};

  // _REST._httpRequest('GET',vxmlBaseUrl,vxmlAppPath,jsonData,handlers);
  // _dialog.makeConsultCall(user.getExtension(),transferToExtension,handlers)
  // var errorType    = rsp.object.ApiErrors.ApiError.ErrorType;
  // var errorMessage = rsp.object.ApiErrors.ApiError.ErrorMessage;
  return {

    // Performs all initialization for this gadget. Gets prefs from the gadget xml file
    init: function() {
      var prefs       = new gadgets.Prefs(),
	        id          = prefs.getString("id"),
          baseUrl     = 'http://' + prefs.getString("gadgetServerHost") +
                         ':' + prefs.getString("gadgetServerPort"),
          clientLogs  = finesse.cslogger.ClientLogger,
          finesseUtil = finesse.utilities.Utilities;

      //gadgets.window.adjustHeight();
      // ClientServices are initialized with a reference to the current configuration.
      finesse.clientservices.ClientServices.init(finesse.gadget.Config);
      clientLogs.init(gadgets.Hub, 'CiscoFinesseGadget');
      clientLogs.log('Test: ' + _REST.isAlive());

      //ReactDOM.render(React.createElement(MyComponent21,null),document.getElementById('content01'));

      // Render the UI with ReactJS. Send initial parameters and callbacks here.
      var mountPoint = document.getElementById('content02')
      ReactDOM.render(React.createElement(TransferButton, {callState:callState,onClick: _reactCbk,baseUrl:baseUrl}), mountPoint);
      //ReactDOM.render(_getReactApp(),mountPoint);

      // Init the finesse user object
      user = new finesse.restservices.User({
        id: id,
        // Handlder for when the User object is initially read from the Finesse server.
        onLoad   : _handleUserLoad,
        // Handler for all User updates
        onChange : _handleUserChange
      });

      states = finesse.restservices.User.States();
      dialogActions = finesse.restservices.Dialog.Actions();

      // Initiate the ContainerServices and add a handler for when the tab is visible
      // to adjust the height of this gadget in case the tab was not visible
      // when the html was rendered (adjustHeight only works when tab is visible)
      containerServices = finesse.containerservices.ContainerServices.init();
      containerServices.addHandler(finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB, function() {
	       clientLogs.log('Gadget is now visible');
	        // automatically adjust the height of the gadget to show the html
	        gadgets.window.adjustHeight();
      });
      containerServices.makeActiveTabReq();
    },

    // Initiate call transfer for current Incoming ACD call
    startCallTransfer : function(){
      _startCallTransfer(dialogAcd,user);
    },

    // Tag call with ticket number. Include contactid for previously recorded calls
    // or leave it alone to refer to the current call.
    setTicketNumber: function(ticketnumber){
      _setTicketNumber(ticketnumber,contactid,callid);
    }

  };
}(jQuery,_REST));
