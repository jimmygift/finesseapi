/*
babel --presets es2015,react myreact.js > ReactCode.js
*/

var REACT_GADGET_VERSION='0.840.27';
var reValidation = "\\w{2}\\d{6}";

function userIdIsValid(id){
  if (id && id !=='000000'){
    //alert('valid user id: ' + id);
    return true;
  } else {
    //alert('invalid user id:' + id)
    return false;
  }
};

function _log(msg){
  finesse.modules.CiscoFinesseGadget.log(msg);
  return;
};

var tooltip = React.createElement(ReactBootstrap.Tooltip, { id: 'tooltip' }, 'Asignar ticket.');

var BadgeInstance = React.createClass({
  render: function() {
    return (
      <h5><ReactBootstrap.Label>{this.props.label}</ReactBootstrap.Label>  {this.props.text}</h5>
    )
    //return (<p><ReactBootstrap.Badge>{this.props.label}</ReactBootstrap.Badge>  {this.props.text}</p>)
  }
});

// <span className="glyphicon glyphicon-user"></span>
// {agentSpeechText03.split("\n").map(function(i){return (<span>{i}<br/></span>) } ) }
var AgentSpeech = React.createClass({
  render: function() {
    var text       = this.props.text.replace('%callername%',this.props.callerName),
        text       = text.replace('%callerid%',this.props.callerId),
        textNodes  = text.split("\n").map(function(val,idx){ return (<span key={idx}>{val}<br/></span>)});
        //callerName = this.props.callerName,
        //text  = textNodes.replace('%callername%',callerName);
    //console.log("Text: " + JSON.stringify(text) + " Type " + typeof(text))

    return(
        <div>
        <p>{textNodes}</p>
        </div>
    );
  }
});

var TransferCall  = React.createClass({

 /*
  getInitialState: function() {
    return {
            acdCallerId:     '',
            acdCallerName:   '',
            acdIncomingCall: true,
           };
  },
  */

  handleClick: function(e) {
    //var handlers = {success:this.onSuccess, error:this.onError};
    //this.props.onClick(e);
    //_REST.httpRequest('GET',this.props.baseUrl,'/clientConfig',{},handlers);

    finesse.modules.CiscoFinesseGadget.log('React.TransferCall.handleClick()');
    finesse.modules.CiscoFinesseGadget.startCallTransfer();
  },

  render: function(){
    //_log('React.TransferCall.render() props:' + JSON.stringify(this.props));
    return(
      <div>
        <ReactBootstrap.Button bsStyle="primary" disabled={!this.props.acdIncomingCall} onClick={this.handleClick}>Transferir llamada</ReactBootstrap.Button>
      </div>
    );
  }
});

var TicketNumber  = React.createClass({

  getInitialState: function(){
    return {
      ticketNumber: '',
      ticketAssigned: false,
      ticketNumberIsValid: false,
      //acdIncomingCall: false,
      showTicketAssignedAlert: false
    };
  },

  onSetTicketNumberSuccess: function(){
    alert('Ticket asignado.');
  },

  onSetTicketNumberError: function(){
    alert('Error en asignación de ticket.');
  },

  onTicketNumberAssign: function(e){
    var handlers = { success: this.onSetTicketNumberSuccess, error: this.onSetTicketNumberError};
    this.state.target = e.target;


    // Send value of input field to server and then clear the input field
    if (this.state.ticketNumber!==''){
      var num = this.state.ticketNumber;
      this.setState({ticketNumber: ''});
      finesse.modules.CiscoFinesseGadget.setTicketNumber(num,handlers);
    };

    this.setState({ticketNumber: ''});
    this.setState({ticketAssigned: true});
    //alert('Ticket Asignado');
  },

  onSetTicketNumberSuccess: function() {
    alert('Ticket asignado.');
    //this.state.showTicketAssignedAlert = true;
    //setTimeout(function(){this.state.showTicketAssignedAlert=false;}, 3000);
  },

  onSetTicketNumberError: function() {
    alert('Error en asignación de ticket.');
  },

  setTicketNumber: function(e){
    this.setState({ticketNumber: e.target.value});
  },

  handleButtonClick: function(e){
    //finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    this.state.ticketNumber = '';
    //this.state.value = '';
    alert('Ticket asignado');
    //this.props.onSubmit(e);
  },

  render: function(){
    //_log('React.TicketNumber.render() props:' + JSON.stringify(this.props));

    var value = this.state.ticketNumber;
    return(
      <div>
        <input  type='text'  disabled={!this.props.acdIncomingCall} onChange={this.setTicketNumber} value={value}/>
        <span>&nbsp; &nbsp;</span>
        <ReactBootstrap.OverlayTrigger placement="right" overlay={tooltip}>
        <ReactBootstrap.Button bsStyle="primary" disabled={!this.props.acdIncomingCall && !this.props.ticketAssigned}
          onClick={this.onTicketNumberAssign}>
             Asignar ticket
        </ReactBootstrap.Button>
        </ReactBootstrap.OverlayTrigger>
      </div>
    );
  }
});

var InputField = React.createClass({
  getInitialState: function() {
    return {
      value: this.props.value
    };
  },

  // define the style based on the validity of the input data
  validationState: function() {

    var re = new RegExp("\\w{2}\\d{6}"),
        valid = re.test(this.state.value);

    if (valid) { return 'sucess' }
    else if (! valid){return 'error'};

    //var length = this.state.value.length;
    //if (length > 10) return 'success';
    //else if (length > 5) return 'warning';
    //else if (length > 0) return 'error';
  },

  handleChange: function() {
    var inputValue = this.refs.input.getValue();
    this.setState({value: inputValue});
    this.props.onChange(inputValue);
  },

  render: function() {
    return (
      <ReactBootstrap.Input
        type="text"
        value={this.props.value}
        placeholder=""
        label="Numero de ticket"
        help=""
        bsStyle={this.validationState()}
        hasFeedback
        ref="input"
        groupClassName="group-class"
        labelClassName="label-class"
        onChange={this.handleChange} />
    );
  }
});

// Main ReactJS Component
var ReactCiscoFinesseGadget = React.createClass({

  getVersion: function(){
    return REACT_GADGET_VERSION;
  },

  getInitialState: function() {
    return {active: true,
            activeKey: '1',
            acdCallerId:     '',
            acdCallerName:   '',
            //acdIncomingCall: true,
            agentTeamName:   '',
            gadgetConfig:    this.props.gadgetConfig,
            callState: '',
            ticketNumber: '',
            ticketNumberIsValid: false
           };
  },

  setStateTicketNumber: function(num){
      setState({'ticketNumber': num});
  },

  setStateTicketNumberIsValid: function(bool){
      setState({'ticketNumberIsValid': bool})
  },

  onTicketNumberAssign: function(){
    if (this.state.ticketNumber!==''){
      finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    }
  },

  componentWillMount: function(){
    _log("React.componentWillMount()");
  },

  componentDidMount: function(){
    _log('React.componentDidMount()');
  },

  handleSelect: function(activeKey){
    this.setState({activeKey: activeKey});
  },

  render: function() {
    //_log('ReactCiscoFinesseGadget.render() props:' + JSON.stringify(this.props));

    var createPanel = function(p,index) {
         // Selective speech greeting the caller for both the identified caller case and the anonymous caller case
         //_log('createPanel: p:' + p.class + '  ' + JSON.stringify(this.props));

         if (p.class=='callergreeting') {
           return (
            <ReactBootstrap.Panel header={p.header} eventKey={p.key} key={p.key}>
              <ReactBootstrap.Panel header="Speech">
                <AgentSpeech text={userIdIsValid(this.props.acdCallerId) ? p.speechText: p.altSpeechText} callerName={this.props.acdCallerName} callerId={this.props.acdCallerId} />
              </ReactBootstrap.Panel>
            </ReactBootstrap.Panel>
          );
         // Simple speech text paragraph
         } else if (p.class=='speech') {
           return (
             <ReactBootstrap.Panel header={p.header} eventKey={p.key} key={p.key}>
                <ReactBootstrap.Panel header="Speech">
                  <AgentSpeech text={userIdIsValid(this.props.acdCallerId) ? p.speechText: p.altSpeechText} callerName={this.props.acdCallerName} callerId={this.props.acdCallerId} />
                </ReactBootstrap.Panel>
             </ReactBootstrap.Panel>
           );
         } else if (p.class=='transfer') {
           return (
             <ReactBootstrap.Panel header={p.header} eventKey={p.key} key={p.key}>
                <ReactBootstrap.Panel header="Asignación de ticket" key='1'>
                  <TicketNumber acdIncomingCall={this.props.acdIncomingCall} />
                </ReactBootstrap.Panel>
                <ReactBootstrap.Panel header="Encuesta de evaluación" key='2'>
                  <AgentSpeech text={p.speechText}/>
                  <TransferCall acdIncomingCall={this.props.acdIncomingCall} />
                </ReactBootstrap.Panel>
             </ReactBootstrap.Panel>
           );
         };
       };

       gadgetConfig = this.state.gadgetConfig;

    return (
      <div>
        <ReactBootstrap.PanelGroup activeKey={this.state.activeKey} onSelect={this.handleSelect} accordion>
           {gadgetConfig.map(createPanel,this)}
        </ReactBootstrap.PanelGroup>
      </div>
    );

  },
});
