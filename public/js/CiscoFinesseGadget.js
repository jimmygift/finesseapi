/*


ReactJS Source Code
/public/js/myreact.js

ReactJS Dist Code
 babel --presets es2015,react myreact.js > ReactCode.js


_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: ACD_IN
_processCall(): Process the dialog with id: 18527024, to extension: null, from extension: 16698,          call state: INITIATING, callType: CONSULT
_processCall(): Process the dialog with id: 18527024, to extension: 7772, from extension: 16698,          call state: INITIATED,  callType: CONSULT
_processCall(): Process the dialog with id: 18527012, to extension: 1371, from extension: 39387181470080, call state: ACTIVE,     callType: TRANSFER

CiscoFinesseGadget : _completeTransferError() {"status":400,"content":"<ApiErrors>\n  <ApiError>\n    <ErrorType>Invalid State</ErrorType>\n    <ErrorData></ErrorData>\n    <ErrorMessage>No Active call available on agent for TRANSFER</ErrorMessage>\n  </ApiError>\n</ApiErrors>","object":{"ApiErrors":{"ApiError":{"ErrorType":"Invalid State","ErrorData":null,"ErrorMessage":"No Active call available on agent for TRANSFER"}}}}

2015-12-16T01:15:56.039 -06:00: : ?.?.?.?: Dec 16 2015 01:14:40.048 -0600: CiscoFinesseGadget : _completeTransferError() {"content":"<content>/finesse/api/User/test01/Dialogs<Update>\n  <data>\n    <apiErrors>\n      <apiError>\n        <errorData>4047</errorData>\n        <errorMessage>INVALID_ACTION TRANSFER on extension 16698</errorMessage>\n        <errorType>Generic Error</errorType>\n      </apiError>\n    </apiErrors>\n  </data>\n  <event>put</event>\n  <requestId>025376c1-1906-4a3e-8fc9-2659d64ebbf1</requestId>\n  <source>/finesse/api/Dialog/19226673</source>\n</Update></content><object>\t<Update>\t\t<data>\t\t\t<apiErrors>\t\t\t\t<apiError>\t\t\t\t\t<errorData>4047</errorData>\t\t\t\t\t<errorMessage>INVALID_ACTION TRANSFER on extension 16698</errorMessage>\t\t\t\t\t<errorType>Generic Error</errorType></apiError></apiErrors></data>\t\t<event>put</event>\t\t<requestId>025376c1-1906-4a3e-8fc9-2659d64ebbf1</requestId>\t\t<source>/finesse/api/Dialog/19226673</source></Update></object>","object":{"ApiErrors":{"ApiError":{"ErrorData":"4047","ErrorMessage":"INVALID_ACTION TRANSFER on extension 16698","ErrorType":"Generic Error"}}},"status":400}




ticketNum=1112222&extension=16698&state=TALKING&callId=19250445


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

Add logging to external server
Add ping function
Set reactjs state from external script

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
      callid, contactid,
      sysInfo,
      containerServices,
      gadgetConfigJson,                         // ReactJS Components configuration

      // Get custom paramaters from the Prefs defined at the gadget XML definition file
      prefs         =  new gadgets.Prefs(),
      baseUrl       = 'http://' + prefs.getString('gadgetServerHost') + ':' + prefs.getString('gadgetServerPort'),
      vxmlBaseUrl   = 'http://' + prefs.getString('vxmlServerHost')   + ':' + prefs.getString('vxmlServerPort'),
      vxmlAppPath   = prefs.getString('vxmlServerPath'),
      vxmlUrl       = vxmlBaseUrl + vxmlUrl,
      transferDirn  = prefs.getString('transferDirn'),

      transferToExtension = transferDirn,

      finesseEventsLogging = prefs.getString("finesseEventsLogging"),
      clientLogging = prefs.getString("clientLogging"),

      pingEnabled  = prefs.getString("pingEnabled"),
      pingInterval = prefs.getString("pingInterval"),

      // Bridge to ReactJS state object
      callState = {acdIncomingCall: false,
                   acdCallUsername: '',
                   acdCallUserid:   ''},

      NO_MSG_HEIGHT = 30,
      VERSION='0.840.36',

      _util=finesse.utilities.Utilities,

      // Mount point id for ReactJS user interface
      // mountPoint = document.getElementById('content02'),
      reactjsMountPoint = 'content02',

      _log_ = function(msg,user,dialog){},

      _log = function(msg){
        var handlers = { success: _finesseRemoteLoggingSuccess, error: _finesseRemoteLoggingError},
            user = prefs.getString('extension'),
            dateMs = _util.currentTimeMillis();

        // if enabled log locally with finesseLogging
        if (finesseEventsLogging=='true') {
            //clientLogs.log('FE:'+finesseEventsLogging);
            clientLogs.log(msg);
            msg = dateMs + ' ' + msg;
            _REST.httpRequest('POST',baseUrl,'/finesseLogging',{user: user, msg: msg},handlers)};

        // if enabled log to remote server
        // if (finesseEventsLogging=="true") { _REST.httpRequest('POST',baseUrl,'/finesseLogging',{msg: msg},handlers) }
      },

      _ping = function(msg) {
        var getDelay = function(m){
              return (((new Date()).getTime()) - JSON.parse(m.content).timestamp  );
            },
            handlers = { success: function(msg){ _log('_ping(). Delay ms:' + getDelay(msg)) },
                         error:   function(msg){ clientLogs.log('_ping() Error. ' + JSON.stringify(msg))}},
            user = prefs.getString('extension'),
            timestamp = (new Date()).getTime();

        _REST.httpRequest('POST',baseUrl,'/pong',{user: user, msg: msg, timestamp: timestamp},handlers) ;
      },

      // ReactJS Rendering
      _reactRender = function(reactProps){
         //_log('React.render Props: ' + JSON.stringify(reactProps));
         ReactDOM.render(React.createElement(ReactCiscoFinesseGadget,reactProps),document.getElementById(reactjsMountPoint));
      },

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
          return callData;
        }
      },

      // Dialog and User event handlers -----------------------------------------------------------------
      // We care only about ACD_IN and CONSULT calls, ignore any other type of calls

      // This will occur when a new Dialog is added to the user's collection (new call)
      _handleNewDialog = function(dialog) {
        _log('handleNewDialog() dialog:' + JSON.stringify(_getCallData(dialog)));
      },

      // This will occur when a Dialog is removed from this user's collection (example, end call)
      _handleEndDialog = function(dialog) {
        _log('handleEndDialog()');
      },

      // Handler for additions to the Dialogs collection object.  This will occur when a new
      // Dialog is created on the Finesse server for this user.
      _handleDialogAdd = function(dialog) {
        var callData = _getCallData(dialog),
            callType = callData.callType,
            fromAddress = callData.fromAddress;

        _log('handleDialogAdd() dialog:' + JSON.stringify(_getCallData(dialog)));

        if (dialog && callType==='ACD_IN' && dialogAcd==null) {
          dialogAcd = dialog;
          _log('_handleDialogAdd(). DialogId: ' + dialog.getId()  + ' Type:' + callType);

          // Notify ReactJS state
          var callVars = dialog.getMediaProperties();
          callState['acdIncomingCall'] = true;
          callState['acdCallUsername'] = callVars.callVariable3;
          callState['acdCallUserid']   = callVars.callVariable4;


        // dialog.getToAddress()==transferToExtension is null!!
        } else if (dialog && callType==='CONSULT' && dialogConsult==null){
          dialogConsult = dialog;
          _log('_handleDialogAdd(). DialogId:' + dialog.getId()  + ' DialogType:' + callType);
          dialogConsult.addHandler('change', _handleDialogsChanged);

        } else {
          _log('_handleDialogAdd(). Invalid dialog. DialogId:' + dialog.getId() + ' DialogType:' + callType + ' toAddress:' + callData.DNIS);
        }
      },

      // This will occur when a Dialog is removed from the Dialogs collection (example, end call)
      _handleDialogDelete = function(dialog) {
        var callType = _getCallData(dialog).callType;

        // This will happen if the incoming call is lost (ie user hangups) before any further
        // action (ie. transfer) is taken by the agent.
        if (dialog!==null && callType==='ACD_IN' && dialogAcd!==null){
          dialogAcd = null;
          _log('_handleDialogDelete(). Id:' + dialog.getId()  + ' Type:'  + callType);

          // Notify ReactJS
          var reactProps = {acdIncomingCall: false,
                            acdCallerId: '' ,
                            acdCallerName: ''};

          _reactRender(reactProps);

        // This will only happen if the consult call is lost (ie call control failure)
        } else if (dialog!==null && callType==="CONSULT" && dialogConsult!==null){
          dialogConsult = null;
          _log('_handleDialogDelete(). DialogId: ' + dialog.getId()  + ' DialogType:' + callType);

        // Just before deleting the original ACD and CONSULT call from the dialogs collection both dialogs
        // appear as type TRANSFER
        } else if (dialog!==null && callType==="TRANSFER") {
          _log('_handleDialogDelete(). DialogId:' + dialog.getId() + ' DialogType:' + callType);
          var callId = callId.getId();
          if (dialogConsult.getId()==dialog.getId()) {
            dialogConsult=null;
          } else if (dialogAcd.getId()==dialog.getId()) {
            dialogAcd=null;
          }
        } else {
          _log('_handleDialogDelete(). Invalid dialog delete. DialogId:' + dialog.getId() + ' DialogType:' + callType);
        }
      },

      _handleDialogsLoaded = function() {
  	     _log ('_handleDialogsLoaded()');
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
        var dialogCollection = dialogs.getCollection();

        for (dialogId in dialogCollection) {
          if (dialogCollection.hasOwnProperty(dialogId)) {
             var dialog   = dialogCollection[dialogId],
                 callData = _getCallData(dialog);
             _log('_handleDialogsChanged(). callType:' + callData.callType + ' callState:' + callData.callState);
             if (callData.callType=="CONSULT" && callData.callState=="ACTIVE") {
                 //_log('_handleDialogsChanged. CONSULT call is ACTIVE');
                 _startConsultCallSuccess();
             }
          }
        }
      },

      // Handler for the onLoad of a User object.  This occurs when the User object is initially read
      // from the Finesse server.  Any once only initialization should be done within this function.
      _handleUserLoad = function(userevent) {
	      _log ('_handleUserLoad() State:' + user.getState());

        // Get an instance of the dialogs collection and register handlers for dialog additions and removals
        dialogs = user.getDialogs( {
             onCollectionAdd    : _handleDialogAdd,
             onCollectionDelete : _handleDialogDelete,
	           onLoad :  _handleDialogsLoaded,
             onChange: _handleDialogsChanged
        });

        var _getReactConfigSuccess = function(res){
                //_log('_getReactConfigSuccess() resp:' + JSON.stringify(res));

                gadgetConfigJson = JSON.parse(res['content']);

                // Initial rendering of ReactJS components
                var reactProps = {
                                  acdIncomingCall: false,
                                  //acdCallerId: '' ,
                                  //acdCallerName: '',
                                  //agentTeamName: user.getTeamName(),
                                  //agentTeamId:   user.getTeamId(),
                                  gadgetConfig:  gadgetConfigJson['agentSpeech']},
                    gadgetTitle = gadgetConfigJson.gadgetDesc;

                //_log('Gadget: ' + JSON.stringify(gadgetConfigJson))
                _log('Gadget Name: ' + gadgetTitle);
                _log('Initial React props: ' + JSON.stringify(reactProps));

                // Override the title set on the Gadget XML config
                gadgets.window.setTitle(gadgetTitle);

                // Initial ReactJS render
                _reactRender(reactProps);

                // Was the ReactJS render successfull ?
                if(document.getElementById(reactjsMountPoint).innerHTML=="") {
                    _log('init(). mountPoint:' + reactjsMountPoint + 'React component not loaded.' );}
                else {
                    _log('init(). mountPoint:' + reactjsMountPoint + 'React component loaded.');
                }
            },
            _getReactConfigError   = function(res){
              _log('_getReactConfigError()');
            },
            handlers = { success: _getReactConfigSuccess,
                         error:   _getReactConfigError};

        // Get Gadget ReactJS JSON Config
        _REST.httpRequest('GET',baseUrl,'/getReactConfig',
                              {team:      user.getTeamName(),
                               teamId:    user.getTeamId(),
                               extension: user.getExtension(),
                               firstName: user.getFirstName(),
                               lastName:  user.getLastName()},
                           handlers) ;

      },

      _handleUserChange = function(userevent) {
        if(user.getState()=='NOT_READY') {
          _log('_handleUserChange() State:' + user.getState() + ' Date:' + user.getStateChangeTime() + ' Reason:' + user.getNotReadyReasonCodeId());
        } else {
          _log('_handleUserChange() State:' + user.getState() + ' Date:' + user.getStateChangeTime());
        };
        // JSON.stringify(userevent) );
        //_log(JSON.stringify(userevent));
        if (dialogAcd && user.getState()=='TALKING') {
          //_log('ACD_IN TALKING');

          // Notify ReactJS
          var dialogAcdProperties = dialogAcd.getMediaProperties(),
              reactProps = {acdIncomingCall: true,
                            acdCallerId:   dialogAcdProperties.callVariable4 ,
                            acdCallerName: dialogAcdProperties.callVariable3};

          //_log('props:' + JSON.stringify(reactProps));
          _reactRender(reactProps);
        };
      },

      // Finesse Call Control ---------------------------------------------------------------------------------

      // Initiate call transfer for current incoming ACD call
      // dialog:  ACD In dialog
      // todo No dialog
      // _handleDialogAdd and _handleDialogsChanged handle the CONSULT Transfer success event
      _startCallTransfer = function(){

        //_log('startCallTransfer()');

        // Do we have an incoming valid ACD call, ie ignore silent monitor calls, consult calls, etc.
        if (dialogAcd && (_getCallData(dialogAcd)).callType==='ACD_IN') {
            var handlers = {success: _dummy, error: _startConsultCallError},
                callType = _getCallData(dialogAcd).callType,
                callData = _getCallData(dialogAcd),
                dirn     = user.getExtension();

            _log('_startCallTransfer(). DialogId:' + dialogAcd.getId() +
                            ' ExtNum:' + dirn + ' XferNum:' + transferDirn);

            // Refer the call (post to database) before transferring to final destination
            // Make an "optimistic" call refer.
            _postReferral(callData);

            // Try the consult call
            dialogAcd.makeConsultCall(dirn,transferDirn,handlers);
        } else {
            var msg = '_startCallTransfer(). Invalid dialogs.';
            _log(msg);
        }
      },

      //  dialog:    Consult call dialog
      _completeCallTransfer = function(dialogAcd,dialogConsult){
        _log('completeCallTransfer().')
        _log('completeCallTransfer() dialogAcd:' + JSON.stringify(_getCallData(dialogAcd))
          + ' dialogConsult:' + JSON.stringify(_getCallData(dialogConsult)));
        var handlers = {success: _completeTransferSuccess, error: _completeTransferError},
            callData = _getCallData(dialogAcd),
            dirn     = user.getExtension(),
            excludeSilentMonitor = true,
            TRANSFER = finesse.restservices.Dialog.Actions.TRANSFER;

        // We must have exactly 2 calls excluding silent monitor calls and the destination of the consult call
        // must be the extension number defined for transfers
        if (dialogAcd && (dialogs.getDialogCount(excludeSilentMonitor)==2) && dialogConsult.getToAddress()==transferToExtension) {
           _log('_completeCallTransfer(). Completing transfer call on Dialog: ' + dialogAcd.getId() +
                          ' Extension: '   + dirn +
                          ' Destination: ' + transferDirn + " Action: " + TRANSFER +
                          ' Dialogs:'     + dialogs.getDialogCount(excludeSilentMonitor));
           dialogAcd.requestAction(dirn,TRANSFER,handlers);
        } else {
           var msg = 'Invalid dialogs on _completeCallTransfer().';
           _log(msg);
           handlers.error({status: 500, content: msg});
           return;
        }
      },

      // Server side backend interaction ---------------------------------------------------------------------

      _postReferral = function(callData){
        // This should complete before the transferred call is answered on the IVR
        _log('_postReferral()');
        var jsonData = { originalAni: callData.fromAddress,   // orginalAni=ani (randomId)
                         ani:         callData.extension},
            handlers = { success: _postReferralSuccess, error: _postReferralError};

        _REST.httpRequest('GET',vxmlBaseUrl,vxmlAppPath,jsonData,handlers);
      },

      // Tag call with ticket number. Include contactid for previously recorded calls
      // or leave it alone to refer to the current call.
      // handlers = { success: _setTicketNumberSuccess, error: _setTicketNumberError};
      _setTicketNumber = function(ticketnumber,handlers){

        if ( dialogAcd && ticketnumber.length !== 0 ) {
          var callData = _getCallData(dialogAcd);
          var jsonData = { ticketNum:   ticketnumber.trim(),
                           extension:   user.getExtension(),
                           state:       user.getState(),
                           callId:      callData.callId,
                           contactid:   contactid,
                           originalAni: callData.fromAddress,   // orginalAni=ani (randomId)
                           ani:         callData.extension
                         };

          //_log('_setTicketNumber(). ticketNum:' + jsonData.ticketNum + ' callId:' + jsonData.callId);
          _log('_setTicketNumber(). ' + JSON.stringify(jsonData))
          _REST.httpRequest('POST',baseUrl,'/tickets',jsonData,handlers);
        } else {
          _log('_setTicketNumber(). Invalid Data. TicketNum:' + ticketnumber + ' callId:' + callid + ' dialogAcd:' + dialogAcd);
        }
      },

      _getLastContacts = function(){

        var jsonData = { extension: user.getExtension(),
                         limit:     5},
            handlers = { success: _getLastContactsSuccess,
                         error:   _getLastContactsError};

        _log('_getLastContacts().  Extension:' + jsonData.extension);

        _REST.httpRequest('GET',baseUrl,'/getLastContacts',jsonData,handlers);
      },

      // Call Control Success / Error Callbacks --------------------------------------------------------------

      _startConsultCallSuccess = function(rsp) {
        _log('startConsultCallSuccess..');

        //var callData = _getCallData(dialogConsult);
	       _log('_startConsultCallSuccess(). \n DialogConsult: ' +
            JSON.stringify(_getCallData(dialogConsult)) + '\n DialogAcd:' + JSON.stringify(_getCallData(dialogAcd)));

         /*
         var delay    = 5000,
             dialog   = dialogAcd,
             callData = _getCallData(dialogAcd);
         */
         // Refer the call (post to database) before transferring to final destination
         // postReferral() must complete before this !!
         //_postReferral(callData);

         //_completeCallTransfer(dialogAcd,dialogConsult);

         setTimeout(_completeCallTransfer(dialogAcd,dialogConsult),3000);
      },

      // dialog: originalCallDialog
      _startConsultCallError = function(rsp) {
	       _log('_startConsultCallError() ' + rsp);
      },

      _completeTransferSuccess = function(rsp){
        _log('_completeTransferSuccess()');
        dialogAcd=null;
        dialogConsult=null;

        // Notify ReactJS
        var reactProps = {acdIncomingCall: false,
                          acdCallerId: '' ,
                          acdCallerName: ''};

        _log('reactProps: ' + JSON.stringify(reactProps));
        _reactRender(reactProps);
      },

      _completeTransferError = function(rsp){
        _log('_completeTransferError() ' + JSON.stringify(rsp) );
      },

      // Server side success/error callbacks ------------------------------------------------------------------

      _setTicketNumberSuccess = function(rsp) {
        _log('_setTicketNumberSuccess()');
      },

      _setTicketNumberError = function(rsp) {
        _log('_setTicketNumberError()');
      },

      _postReferralSuccess = function(rsp) {
        _log('_postReferralSuccess()');
      },

      _postReferralError = function(rsp) {
        _log('_postReferralError()');
      },

      _finesseRemoteLoggingSuccess = function(rsp) {

      },

      _finesseRemoteLoggingError = function(rsp) {

      },

      _dummy = function(e) {
        _log('_dummy(). \n DialogConsult: ' +
           JSON.stringify(_getCallData(dialogConsult)) + '\n DialogAcd:' + JSON.stringify(_getCallData(dialogAcd)));
      };

  return {
    // Performs all initialization for this gadget. Gets prefs from the gadget xml file
    init: function() {
      var prefs       = new gadgets.Prefs(),
	        id          = prefs.getString("id"),
          baseUrl     = 'http://' + prefs.getString("gadgetServerHost") +
                         ':' + prefs.getString("gadgetServerPort"),
          TOPICS      = finesse.containerservices.ContainerServices.Topics;
          //clientLogs  = finesse.cslogger.ClientLogger,
          //finesseUtil = finesse.utilities.Utilities;

      // ClientServices are initialized with a reference to the current configuration.
      finesse.clientservices.ClientServices.init(finesse.gadget.Config);

      finesse.clientservices.ClientServices.registerOnConnectHandler(function(){
        _log('BOSH connection established');
        _log('ReactCiscoFinesseGadget version: ' + REACT_GADGET_VERSION);
        _log('Finesse Gadget version: ' + VERSION );
        _log('restRequest version: '    + _REST.getVersion());
      });

      finesse.clientservices.ClientServices.registerOnDisconnectHandler(function(){
        _log('BOSH connection lost');
      });

      _log('init(). Initializing ClientServices.');

      clientLogs.init(gadgets.Hub, 'CiscoFinesseGadget');

      //gadgets.window.setTitle('This is my name');

      // Init the finesse user object
      user = new finesse.restservices.User({
        id: id,
        // Handlder for when the User object is initially read from the Finesse server.
        onLoad   : _handleUserLoad,
        // Handler for all User updates
        onChange : _handleUserChange
      });

      // Init the ContainerServices
      containerServices = finesse.containerservices.ContainerServices.init();

      // Add a handler for when the tab is visible
      // to adjust the height of this gadget in case the tab was not visible
      // when the html was rendered (adjustHeight only works when tab is visible)
      containerServices.addHandler(TOPICS.ACTIVE_TAB, function(e) {
	        _log('containerServices. Gadget is now visible. GadgetId:' +
                  containerServices.getMyGadgetId() + ' TabId:' + containerServices.getMyTabId());
	        // automatically adjust the height of the gadget to show the html
	        gadgets.window.adjustHeight();
      });

      containerServices.addHandler(TOPICS.TIMER_TICK_EVENT, function(e) {
          //_log('Timer Tick Event. ' + e.getDateQueued());
      });

      containerServices.addHandler(TOPICS.RELOAD_GADGET_EVENT, function(e) {
          _log('Gadget Reload Event');
      });

      containerServices.addHandler(TOPICS.WORKFLOW_ACTION_EVENT, function(e) {
          //_log('Workflow Action Event Name:' + e.getName() + ' Type:' + e.getType());
      });

      containerServices.addHandler(TOPICS.GADGET_VIEW_CHANGED_EVENT, function(e) {
          //_log('GadgetViewChanged Action Event');
      });

      //containerServices.activateMyTab();
      containerServices.makeActiveTabReq();

    },

    // Initiate call transfer for current Incoming ACD call
    startCallTransfer: function(){
      _startCallTransfer();
    },

    // Tag call with ticket number. Include contactid for previously recorded calls
    // or leave it alone to refer to the current call.
    setTicketNumber: function(ticketnumber,handelers){
      _setTicketNumber(ticketnumber,handlers);
    },

    // Reloads the gadget code. Useful for testing.
    reloadGadget: function(){
      containerServices.reloadMyGadget();
    },

    ping: function(msg){
      _ping(msg);
    },

    // Call the log function outside the CiscoFinesseGadget, ie. ReactJs
    log: function(msg){
      _log(msg);
    }
  };
}(jQuery,_REST));


//setInterval(function(){ alert("Hello"); }, 15000);
if(true) {
  //var pingInterval = finesse.modules.CiscoFinesseGadget.pingInterval;
  var pingInterval = 30;
  setInterval(function(){ finesse.modules.CiscoFinesseGadget.ping("Ping Pong"); }, (pingInterval * 1000));
}
