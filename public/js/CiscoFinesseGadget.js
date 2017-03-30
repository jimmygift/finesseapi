/*

This is the base Gadget. 
No visual components here just logging of call/user events back to the Gadget server.

This gadget is useful as a source of events for dashboard applications and testing of finesse events.

Google Gadgets API
https://developers.google.com/gadgets/docs/overview

Cisco Finesse API
https://developer.cisco.com/site/finesse/

finesse.restservices.User()
 hasAgentRole()
 hasSupervisorRole()
 getTeamId()
 getQueues()

finesse.restservices.Queue()
 getId()
 getName()
 getStatistics().callsInQueue
 getStatistics().startTimeOfLongestCallInQueue

Init Steps:

  init() -> _handleUserLoad() -> _handleDialogsLoaded()

*/

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
finesse.modules.EventLoggingGadget = (function (_REST) {

  var user, dialogs, states, dialogActions, sysInfo, containerServices,    // Finesse Objects
      gadgetConfigJson,                                                    // ReactJS Components configuration

      // Get custom paramaters from the Prefs defined at the gadget XML definition file
      prefs         =  new gadgets.Prefs(),
      baseUrl       = 'http://' + prefs.getString('gadgetServerHost') + ':' + prefs.getString('gadgetServerPort'),
  
      finesseEventsLogging = prefs.getString("finesseEventsLogging"),
      clientLogging = prefs.getString("clientLogging"),

      pingEnabled  = prefs.getString("pingEnabled"),
      pingInterval = prefs.getString("pingInterval"),

      NO_MSG_HEIGHT = 30,
      FINESSE_GADGET_VERSION='0.6',

      _util=finesse.utilities.Utilities,

      _log = function(msg){
        var handlers = {success: _finesseRemoteLoggingSuccess, error: _finesseRemoteLoggingError},
            msgJson = {},
            msgTxt  = '';

        // if enabled log locally with finesseLogging
        if (finesseEventsLogging=='true') {

            // get dialog info and merge hash arrays
            if (msg.dialog!=null){
               Object.assign(msg,_getCallData(msg.dialog));
               delete msg.dialog;
            };

            // is the user object initialized ?
            if (user) {
              msg['ext']       = user.getExtension(),
              msg['team']      = user.getTeamName(),
              msg['state']     = user.getState(),
              msg['ts']        = user.getStateChangeTime(),
              msg['name']      = user.getLastName() + ', ' + user.getFirstName(),
              msg['ua']        = navigator.userAgent;
            }; 
            
            msgTxt = JSON.stringify(msg);
            
            // Local logging to JS console
            clientLogs.log(msgTxt);

            _REST.httpRequest('POST',baseUrl,'/finesseLogging',{msg: msgTxt},handlers)};

        // if enabled log to remote server
        // if (finesseEventsLogging=="true") { _REST.httpRequest('POST',baseUrl,'/finesseLogging',{msg: msg},handlers) }
      },

      _ping = function(msg) {
        // Get RTT time 
        var getDelay = function(m){
              return (((new Date()).getTime()) - JSON.parse(m.content).timestamp);
            },
            handlers = { success: function(msg){ _log({evt:'_ping()', RTT: getDelay(msg)}) },
                         error:   function(msg){ clientLogs.log('_ping() Error. ' + JSON.stringify(msg))}},
            user = prefs.getString('extension'),
            timestamp = (new Date()).getTime();

        _REST.httpRequest('POST',baseUrl,'/pong',{user: user, msg: msg, timestamp: timestamp},handlers) ;
      },

      _getCallData = function(dialog){

        if (dialog) {
          return {
                 DNIS        : dialog.getMediaProperties().DNIS,
	               callType    : dialog.getMediaProperties().callType,
                 callId      : dialog.getId(),
	               fromAddress : dialog.getFromAddress(),
	               toAddress   : dialog.getToAddress(),
                 callState   : dialog.getState(),
                 counters    : JSON.stringify(dialog.getParticipantTimerCounters(user.getExtension()))
               }
        }
      },

      // Dialog and User event handlers -----------------------------------------------------------------
     
      // Handler for additions to the Dialogs collection object.  This will occur when a new
      // Dialog is created on the Finesse server for this user.
      _handleDialogsAdd = function(dialog) {
        _log({evt: 'handleDialogAdd', dialog: dialog});
        
        // add a dialog change handler in case the callvars didn't arrive yet
        dialog.addHandler('change', _handleDialogsChanged);
      },

       _handleDialogsChanged = function(dialog) {
         _log({evt: 'handleDialogChange', dialog: dialog});
      },

      // This will occur when a Dialog is removed from the Dialogs collection (example, end call)
      _handleDialogsDelete = function(dialog) {
        _log({evt: 'handleDialogDelete', dialog: dialog});
      },

      _handleDialogsLoaded = function() {
  	     _log({evt: 'handleDialogsLoaded'});
         var dialogCollection, dialogId;
         //Render any existing dialogs
         dialogCollection = dialogs.getCollection();
         for (dialogId in dialogCollection) {
           if (dialogCollection.hasOwnProperty(dialogId)) {
             _handleDialogsAdd(dialogCollection[dialogId]);
           }
         }
      },

      // Handler for the onLoad of a User object.  This occurs when the User object is initially read
      // from the Finesse server.  Any once only initialization should be done within this function.
      _handleUserLoad = function(e) {
	        _log({evt: 'handleUserLoad'});

          dialogs = user.getDialogs({
    	       onCollectionAdd :    _handleDialogsAdd,
             onCollectionDelete : _handleDialogsDelete,
             onLoad :             _handleDialogsLoaded
          });
      },

      _handleUserChange = function(e) {
        if(user.getState()=='NOT_READY') {
          _log({evt: 'handleUserChange', date: user.getStateChangeTime(), reason: user.getNotReadyReasonCodeId()});
        } else {
          _log({evt: 'handleUserChange', date: user.getStateChangeTime()});
        };
      },

      _finesseRemoteLoggingSuccess = function(r) {

      },

      _finesseRemoteLoggingError = function(r) {
          clientLogs.log('Error sending data to backend server.');
      },

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
        var logTxt = 'BOSH connection established.' + 
                     ' \nGadget version: ' + REACT_GADGET_VERSION +
                     ' \nFinesse Gadget version: ' + FINESSE_GADGET_VERSION + 
                     ' \nrestRequest version: '    + _REST.getVersion();
        _log({msg: logTxt});
      });

      finesse.clientservices.ClientServices.registerOnDisconnectHandler(function(){
        _log({msg: 'BOSH connection lost.'});
      });

      _log({evt: 'ContainerServices.init()', msg: 'Initializing ClientServices.'});

      clientLogs.init(gadgets.Hub, 'EventLoggingGadget');

      // Init the finesse user object
      user = new finesse.restservices.User({
        id: id,
        // Handler for when the User object is initially read from the Finesse server.
        onLoad   : _handleUserLoad,
        // Handler for all User updates
        onChange : _handleUserChange
      });

      sysInfo = new finesse.restservices.SystemInfo();
      
      // Init the ContainerServices
      containerServices = finesse.containerservices.ContainerServices.init();

      // Add a handler for when the tab is visible
      // to adjust the height of this gadget in case the tab was not visible
      // when the html was rendered (adjustHeight only works when tab is visible)
      containerServices.addHandler(TOPICS.ACTIVE_TAB, function(e) {
	        _log({evt: 'TOPICS.ACTIVE_TAB',
                msg: 'containerServices. Gadget is now visible. GadgetId:' +
                  containerServices.getMyGadgetId() + ' TabId:' + containerServices.getMyTabId()});
	        // automatically adjust the height of the gadget to show the html
	        gadgets.window.adjustHeight();
      });

      containerServices.addHandler(TOPICS.TIMER_TICK_EVENT, function(e) {
          //_log('Timer Tick Event. ' + e.getDateQueued());
      });

      containerServices.addHandler(TOPICS.RELOAD_GADGET_EVENT, function(e) {
          _log({evt:'TOPICS.RELOAD_GADGET_EVENT'});
      });

      containerServices.addHandler(TOPICS.WORKFLOW_ACTION_EVENT, function(e) {
          _log({evt: 'TOPICS.WORKFLOW_ACTION_EVENT', msg:'Workflow Action Event Name:' + e.getName() + ' Type:' + e.getType()});
      });

      containerServices.addHandler(TOPICS.GADGET_VIEW_CHANGED_EVENT, function(e) {
          _log({evt: 'TOPICS.GADGET_VIEW_CHANGED_EVENT', msg:'GadgetViewChanged Action Event'});
      });

      containerServices.addHandler(TOPICS.TIMER_TICK_EVENT, function(e){ });

      //containerServices.activateMyTab();
      containerServices.makeActiveTabReq();

    },

    // Reloads the gadget code. Useful for testing and failover.
    reloadGadget: function(url){
      if(url){
        containerServices.reloadMyGadgetFromUrl(url)
      }else{
        containerServices.reloadMyGadget();
      }
    },

    ping: function(msg){
      _ping(msg);
    },

    // Call the log function outside the CiscoFinesseGadget, ie. ReactJs
    log: function(msg){
      _log(msg);
    }
  };
}(_REST));

//setInterval(function(){ alert("Hello"); }, 15000);
if(true) {
  //var pingInterval = finesse.modules.CiscoFinesseGadget.pingInterval;
  var pingInterval = 30;
  setInterval(function(){ finesse.modules.EventLoggingGadget.ping("Ping Pong"); }, (pingInterval * 1000));
}