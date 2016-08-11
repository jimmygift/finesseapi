'use strict';

/*
babel --presets es2015,react myreact.js > ReactCode.js
*/

var REACT_GADGET_VERSION = '0.840.26';
var reValidation = "\\w{2}\\d{6}";

function userIdIsValid(id) {
  if (id && id !== '000000') {
    //alert('valid user id: ' + id);
    return true;
  } else {
    //alert('invalid user id:' + id)
    return false;
  }
};

function _log(msg) {
  finesse.modules.CiscoFinesseGadget.log(msg);
  return;
};

var tooltip = React.createElement(ReactBootstrap.Tooltip, { id: 'tooltip' }, 'Asignar ticket.');

var BadgeInstance = React.createClass({
  displayName: 'BadgeInstance',

  render: function render() {
    return React.createElement(
      'h5',
      null,
      React.createElement(
        ReactBootstrap.Label,
        null,
        this.props.label
      ),
      '  ',
      this.props.text
    );
    //return (<p><ReactBootstrap.Badge>{this.props.label}</ReactBootstrap.Badge>  {this.props.text}</p>)
  }
});

// <span className="glyphicon glyphicon-user"></span>
// {agentSpeechText03.split("\n").map(function(i){return (<span>{i}<br/></span>) } ) }
var AgentSpeech = React.createClass({
  displayName: 'AgentSpeech',

  render: function render() {
    var text = this.props.text.replace('%callername%', this.props.callerName),
        text = text.replace('%callerid%', this.props.callerId),
        textNodes = text.split("\n").map(function (val, idx) {
      return React.createElement(
        'span',
        { key: idx },
        val,
        React.createElement('br', null)
      );
    });
    //callerName = this.props.callerName,
    //text  = textNodes.replace('%callername%',callerName);
    //console.log("Text: " + JSON.stringify(text) + " Type " + typeof(text))

    return React.createElement(
      'div',
      null,
      React.createElement(
        'p',
        null,
        textNodes
      )
    );
  }
});

var TransferCall = React.createClass({
  displayName: 'TransferCall',

  /*
   getInitialState: function() {
     return {
             acdCallerId:     '',
             acdCallerName:   '',
             acdIncomingCall: true,
            };
   },
   */

  handleClick: function handleClick(e) {
    //var handlers = {success:this.onSuccess, error:this.onError};
    //this.props.onClick(e);
    //_REST.httpRequest('GET',this.props.baseUrl,'/clientConfig',{},handlers);

    finesse.modules.CiscoFinesseGadget.log('React.TransferCall.handleClick()');
    finesse.modules.CiscoFinesseGadget.startCallTransfer();
  },

  render: function render() {
    //_log('React.TransferCall.render() props:' + JSON.stringify(this.props));
    return React.createElement(
      'div',
      null,
      React.createElement(
        ReactBootstrap.Button,
        { bsStyle: 'primary', disabled: !this.props.acdIncomingCall, onClick: this.handleClick },
        'Transferir llamada'
      )
    );
  }
});

var TicketNumber = React.createClass({
  displayName: 'TicketNumber',

  getInitialState: function getInitialState() {
    return {
      ticketNumber: '',
      ticketAssigned: false,
      ticketNumberIsValid: false,
      //acdIncomingCall: false,
      showTicketAssignedAlert: false
    };
  },

  onSetTicketNumberSuccess: function onSetTicketNumberSuccess() {},

  onSetTicketNumberError: function onSetTicketNumberError() {},

  onTicketNumberAssign: function onTicketNumberAssign(e) {
    var handlers = { success: this.onSetTicketNumberSuccess, error: this.onSetTicketNumberError };
    this.state.target = e.target;

    alert('Ticket asignado.');
    // Send value of input field to server and then clear the input field
    if (this.state.ticketNumber !== '') {
      var num = this.state.ticketNumber;
      this.state.ticketNumber = '';
      finesse.modules.CiscoFinesseGadget.setTicketNumber(num, handlers);
    }
    setState({ ticketNumber: '' });
    setState({ ticketAssigned: true });
    //alert('Ticket Asignado');
  },

  onSetTicketNumberSuccess: function onSetTicketNumberSuccess() {
    //this.state.showTicketAssignedAlert = true;
    //setTimeout(function(){this.state.showTicketAssignedAlert=false;}, 3000);
  },

  onSetTicketNumberError: function onSetTicketNumberError() {
    alert('Error en asignación de ticket.');
  },

  setTicketNumber: function setTicketNumber(e) {
    this.setState({ ticketNumber: e.target.value });
  },

  handleButtonClick: function handleButtonClick(e) {
    //finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    this.state.ticketNumber = '';
    //this.state.value = '';
    alert('Ticket asignado');
    //this.props.onSubmit(e);
  },

  render: function render() {
    //_log('React.TicketNumber.render() props:' + JSON.stringify(this.props));

    var value = this.state.ticketNumber;
    return React.createElement(
      'div',
      null,
      React.createElement('input', { type: 'text', disabled: !this.props.acdIncomingCall, onChange: this.setTicketNumber, value: value }),
      React.createElement(
        'span',
        null,
        '   '
      ),
      React.createElement(
        ReactBootstrap.OverlayTrigger,
        { placement: 'right', overlay: tooltip },
        React.createElement(
          ReactBootstrap.Button,
          { bsStyle: 'primary', disabled: !this.props.acdIncomingCall && !this.props.ticketAssigned,
            onClick: this.onTicketNumberAssign },
          'Asignar ticket'
        )
      )
    );
  }
});

var InputField = React.createClass({
  displayName: 'InputField',

  getInitialState: function getInitialState() {
    return {
      value: this.props.value
    };
  },

  // define the style based on the validity of the input data
  validationState: function validationState() {

    var re = new RegExp("\\w{2}\\d{6}"),
        valid = re.test(this.state.value);

    if (valid) {
      return 'sucess';
    } else if (!valid) {
      return 'error';
    };

    //var length = this.state.value.length;
    //if (length > 10) return 'success';
    //else if (length > 5) return 'warning';
    //else if (length > 0) return 'error';
  },

  handleChange: function handleChange() {
    var inputValue = this.refs.input.getValue();
    this.setState({ value: inputValue });
    this.props.onChange(inputValue);
  },

  render: function render() {
    return React.createElement(ReactBootstrap.Input, {
      type: 'text',
      value: this.props.value,
      placeholder: '',
      label: 'Numero de ticket',
      help: '',
      bsStyle: this.validationState(),
      hasFeedback: true,
      ref: 'input',
      groupClassName: 'group-class',
      labelClassName: 'label-class',
      onChange: this.handleChange });
  }
});

// Main ReactJS Component
var ReactCiscoFinesseGadget = React.createClass({
  displayName: 'ReactCiscoFinesseGadget',

  getVersion: function getVersion() {
    return REACT_GADGET_VERSION;
  },

  getInitialState: function getInitialState() {
    return { active: true,
      activeKey: '1',
      acdCallerId: '',
      acdCallerName: '',
      //acdIncomingCall: true,
      agentTeamName: '',
      gadgetConfig: this.props.gadgetConfig,
      callState: '',
      ticketNumber: '',
      ticketNumberIsValid: false
    };
  },

  setStateTicketNumber: function setStateTicketNumber(num) {
    setState({ 'ticketNumber': num });
  },

  setStateTicketNumberIsValid: function setStateTicketNumberIsValid(bool) {
    setState({ 'ticketNumberIsValid': bool });
  },

  onTicketNumberAssign: function onTicketNumberAssign() {
    if (this.state.ticketNumber !== '') {
      finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    }
  },

  componentWillMount: function componentWillMount() {
    _log("React.componentWillMount()");
  },

  componentDidMount: function componentDidMount() {
    _log('React.componentDidMount()');
  },

  handleSelect: function handleSelect(activeKey) {
    this.setState({ activeKey: activeKey });
  },

  render: function render() {
    //_log('ReactCiscoFinesseGadget.render() props:' + JSON.stringify(this.props));

    var createPanel = function createPanel(p, index) {
      // Selective speech greeting the caller for both the identified caller case and the anonymous caller case
      //_log('createPanel: p:' + p.class + '  ' + JSON.stringify(this.props));

      if (p.class == 'callergreeting') {
        return React.createElement(
          ReactBootstrap.Panel,
          { header: p.header, eventKey: p.key, key: p.key },
          React.createElement(
            ReactBootstrap.Panel,
            { header: 'Speech' },
            React.createElement(AgentSpeech, { text: userIdIsValid(this.props.acdCallerId) ? p.speechText : p.altSpeechText, callerName: this.props.acdCallerName, callerId: this.props.acdCallerId })
          )
        );
        // Simple speech text paragraph
      } else if (p.class == 'speech') {
          return React.createElement(
            ReactBootstrap.Panel,
            { header: p.header, eventKey: p.key, key: p.key },
            React.createElement(
              ReactBootstrap.Panel,
              { header: 'Speech' },
              React.createElement(AgentSpeech, { text: userIdIsValid(this.props.acdCallerId) ? p.speechText : p.altSpeechText, callerName: this.props.acdCallerName, callerId: this.props.acdCallerId })
            )
          );
        } else if (p.class == 'transfer') {
          return React.createElement(
            ReactBootstrap.Panel,
            { header: p.header, eventKey: p.key, key: p.key },
            React.createElement(
              ReactBootstrap.Panel,
              { header: 'Asignación de ticket', key: '1' },
              React.createElement(TicketNumber, { acdIncomingCall: this.props.acdIncomingCall })
            ),
            React.createElement(
              ReactBootstrap.Panel,
              { header: 'Encuesta de evaluación', key: '2' },
              React.createElement(AgentSpeech, { text: p.speechText }),
              React.createElement(TransferCall, { acdIncomingCall: this.props.acdIncomingCall })
            )
          );
        };
    };

    gadgetConfig = this.state.gadgetConfig;

    return React.createElement(
      'div',
      null,
      React.createElement(
        ReactBootstrap.PanelGroup,
        { activeKey: this.state.activeKey, onSelect: this.handleSelect, accordion: true },
        gadgetConfig.map(createPanel, this)
      )
    );
  }
});

