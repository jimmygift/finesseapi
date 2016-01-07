"use strict";

/*
acentos

{
"callVariable1":null,
"callVariable2":null,
"callVariable3":"GONZALEZ ROARO CARLOS ALBERTO          ",
"callVariable4":"20221582",
"callVariable5":"Activo    ",
"callVariable6":"PI Mexico                ",
"callVariable7":"PIM Oficinas           /AD HABITAT     ",
"callVariable8":"Regular          ",
"callVariable9":"MC    ",
"callVariable10":"Vicepresidente de Ventas Canal DTS     ",
"user.layout":"ENLACE_LATAM",
"DNIS":"16698",
"callType":"ACD_IN",
"dialedNumber":"1354",
"outboundClassification":null


.split("\n").map(function(i){return (<span>{i}<br/></span>) }

*/

function userIdIsValid(id) {
  if (id && id !== '000000') {
    return true;
  } else {
    return false;
  }
};

var BadgeInstance = React.createClass({
  displayName: "BadgeInstance",

  render: function render() {
    return React.createElement(
      "h5",
      null,
      React.createElement(
        ReactBootstrap.Label,
        null,
        this.props.label
      ),
      "  ",
      this.props.text
    );
    //return (<p><ReactBootstrap.Badge>{this.props.label}</ReactBootstrap.Badge>  {this.props.text}</p>)
  }
});

var BadgeInstance01 = React.createElement(BadgeInstance, { key: 1, label: "1", text: "Atencion inicial" });
var BadgeInstance02 = React.createElement(BadgeInstance, { key: 2, label: "2", text: "Atencion" });
var BadgeInstance03 = React.createElement(BadgeInstance, { key: 3, label: "3", text: "Asignar ticket" });
var BadgeInstance04 = React.createElement(BadgeInstance, { key: 4, label: "4", text: "Transferir a encuesta" });

var agentSpeechText01 = "Gracias por llamar a Enlace\nMi nombre es ___\nTengo el gusto con ___ ?\nSu numero de nomina es ___ ?\nPor motivos de seguridad, me puede proporcionar su fecha de nacimiento ?\nGracias por la informacion. Como te puedo ayudar el dia de hoy ?\n";

var agentSpeechText0102 = "Gracias por llamar a Enlace.\nMi nombre es ___.\nCon quien tengo el gusto ?\nPara ayudarlo mejor me proporciona su numero de nomina o GPID por favor ?\nPor motivos de seguridad, me puede proporcionar su fecha de nacimiento ?\nGracias por la informacion. Como te puedo ayudar el dia de hoy ?\n";

var agentSpeechText02 = "Cuando se presento ese problema\nA que hora marcaste ?\nEnviaste correo a Pepsico Enlace ?\nHaz llamado a enlace sobre este tema anteriormente ?\nQue error te aparece ?\nLo haz consultado con tu generalista o jefe directo ?\nCuando entregaste tu Carta de Retencion ?\nA que herramienta estas intentando entrar ?\nHaz tenido faltas o incapacidades recientemente ?\nTe ayudaron a hacer el tramite en tu portal o lo hiciste solo ?\nYa habias mandado papeleria ? cuando? a donde ?\nEsta llamada se registrara con un ticket numero ___, este no es un ticket adicional, solamente es un registro de su llamada\n";

var agentSpeechText03 = "La solucion que nos brinda el area de ___ es ___\nTodavia no tenemos una respuesta dado que el area sigue trabajando en tu tema, estos procesos normalmente ...\nSi revisamos tu solicitud, para poder solucionarlo por completo requerimos tu apoyo en enviarnos ___\nPor el momento no sera posible ___ dado que por politica el area de ___ establece que ___\n";

var agentSpeechText04 = "Por lo tanto, requeriremos se comunique ___ y entonces ya recibiremos el dato solicitado, le parece ?\nEntonces en cuanto nos envie el dato, se procesara la solicitud y podremos finalizar su requerimento, ok ?\nDaremos seguimiento al ticket y en cuanto tengamos una respuesta le llegará un correo de notificacion de que se cerro el ticket. Si gusta se puede comunicar con nosotros para revisarlo a detalle, esta bien ?\nAlgo mas en lo que le pueda ayudar ?\nEsta llamada se registrara con un ticket #___ este no es un ticket adicional, solamente es un registro de su llamada\n";

var agentSpeechText05 = "\nLe pido 30 segundos mas de su tiempo para una encuesta muy breve de dos preguntitas para evaluar mi servicio y la resolucion por parte de Servicios al Personal ok ?\nMuchas gracias por llamar a Enlace, estamos a sus ordenes";

// <span className="glyphicon glyphicon-user"></span>
// {agentSpeechText03.split("\n").map(function(i){return (<span>{i}<br/></span>) } ) }
var AgentSpeech = React.createClass({
  displayName: "AgentSpeech",

  render: function render() {
    var textNodes = this.props.text.split("\n").map(function (i) {
      return React.createElement(
        "span",
        null,
        i,
        React.createElement("br", null)
      );
    });
    //console.log("Text: " + JSON.stringify(text) + " Type " + typeof(text))

    return React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        null,
        textNodes
      )
    );
  }
});

var AgentSpeech01 = React.createElement(AgentSpeech, { text: agentSpeechText01 });

// <span className="glyphicon glyphicon-user"></span>
var AgentSpeech00 = React.createClass({
  displayName: "AgentSpeech00",

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        ReactBootstrap.Table,
        { responsive: true },
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "td",
              null,
              this.props.text.split("\n").map(function (i) {
                return { i: i };
              })
            )
          )
        )
      )
    );
  }
});

var TransferCall = React.createClass({
  displayName: "TransferCall",

  handleClick: function handleClick(e) {
    //var handlers = {success:this.onSuccess, error:this.onError};
    //this.props.onClick(e);
    //_REST.httpRequest('GET',this.props.baseUrl,'/clientConfig',{},handlers);

    finesse.modules.CiscoFinesseGadget.startCallTransfer();
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        ReactBootstrap.Button,
        { bsStyle: "primary", onClick: this.handleClick },
        "Transferir llamada"
      )
    );
  }
});

var TicketNumber = React.createClass({
  displayName: "TicketNumber",

  getInitialState: function getInitialState() {
    return {
      ticketNumber: ''
    };
  },

  setTicketNumber: function setTicketNumber(val) {
    this.state.ticketNumber = val;
  },

  handleClick: function handleClick(e) {
    finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    this.state.ticketNumber = '';
    alert('Ticket asignado');
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(InputField, { onChange: this.setTicketNumber }),
      React.createElement(
        ReactBootstrap.Button,
        { bsStyle: "primary", onClick: this.handleClick },
        "Asignar ticket"
      )
    );
  }
});

var InputField = React.createClass({
  displayName: "InputField",

  getInitialState: function getInitialState() {
    return {
      value: ''
    };
  },

  validationState: function validationState() {
    var length = this.state.value.length;
    if (length > 10) return 'success';else if (length > 5) return 'warning';else if (length > 0) return 'error';
  },

  handleChange: function handleChange() {
    var inputValue = this.refs.input.getValue();
    this.setState({ value: inputValue });
    this.props.onChange(inputValue);
  },

  render: function render() {
    return React.createElement(ReactBootstrap.Input, {
      type: "text",
      value: this.state.value,
      placeholder: "",
      label: "Numero de ticket",
      help: "",
      bsStyle: this.validationState(),
      hasFeedback: true,
      ref: "input",
      groupClassName: "group-class",
      labelClassName: "label-class",
      onChange: this.handleChange });
  }
});

// {"acdIncomingCall":true,"acdCallUsername":"TREJO COPADO LUIS FERNANDO","acdCallUserid":"604952"}
// React Callback: {"acdIncomingCall":true,"acdCallUsername":"TREJO COPADO LUIS FERNANDO","acdCallUserid":"604952"}

var TransferButton = React.createClass({
  displayName: "TransferButton",

  getInitialState: function getInitialState() {
    return { active: true,
      activeKey: '1',
      acdCallUserid: '',
      acdCallUsername: '',
      acdIncomingCall: '',
      callState: '',
      ticketNumber: ''
    };
  },

  // Create Callback on Cisco Finesse Gadget

  componentWillMount: function componentWillMount() {
    globalVar.reactCallback = function (data) {
      //alert('React Callback: ' + data.acdCallUserid );
      //alert('This :' + JSON.stringify(this));
      this.setState({ acdCallUserid: data.acdCallUserid });
      alert('New State: ' + this.state.acdCallUserid);
    };
  },

  componentDidMount: function componentDidMount() {
    //alert('Mounted component');
  },

  onSuccess: function onSuccess(rsp) {
    // {"status":200,"content":"{\"gadgetServerHost\":\"11.8.75.75\",\"gadgetServerPort\":\"8082\"}"}
    alert(JSON.stringify(rsp));
  },

  onError: function onError(rsp) {},

  handleClick: function handleClick(e) {
    var handlers = { success: this.onSuccess, error: this.onError };

    this.props.onClick(e);
    _REST.httpRequest('GET', this.props.baseUrl, '/clientConfig', {}, handlers);
  },

  _getLastContactsSuccess: function _getLastContactsSuccess() {},

  _getLastContactsError: function _getLastContactsError() {},

  handleSelect: function handleSelect(activeKey) {
    this.setState({ activeKey: activeKey });
  },

  // userIdIsValid(this.state.acdCallUserid)
  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        ReactBootstrap.PanelGroup,
        { activeKey: this.state.activeKey, onSelect: this.handleSelect, accordion: true },
        React.createElement(
          ReactBootstrap.Panel,
          { header: "Bienvenida", eventKey: "1" },
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Speech" },
            React.createElement(AgentSpeech, { text: userIdIsValid(this.state.acdCallUserid) ? agentSpeechText01 : agentSpeechText0102 })
          )
        ),
        React.createElement(
          ReactBootstrap.Panel,
          { header: "Indagación", eventKey: "2" },
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Speech" },
            React.createElement(AgentSpeech, { text: agentSpeechText02 })
          )
        ),
        React.createElement(
          ReactBootstrap.Panel,
          { header: "Resolución", eventKey: "3" },
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Speech" },
            React.createElement(AgentSpeech, { text: agentSpeechText03 })
          )
        ),
        React.createElement(
          ReactBootstrap.Panel,
          { header: "Cierre", eventKey: "4" },
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Speech" },
            React.createElement(AgentSpeech, { text: agentSpeechText04 })
          )
        ),
        React.createElement(
          ReactBootstrap.Panel,
          { header: "Asignar ticket y enviar a encuesta", eventKey: "5" },
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Speech" },
            React.createElement(AgentSpeech, { text: agentSpeechText05 })
          ),
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Asignacion de ticket" },
            React.createElement(TicketNumber, null)
          ),
          React.createElement(
            ReactBootstrap.Panel,
            { header: "Encuesta de evaluacion" },
            React.createElement(TransferCall, null)
          )
        )
      )
    );
    //return React.createElement('div',{onClick: this.handleClick},'Hello ',this.props.name);
  }
});

//ReactDOM.render(React.createElement(TransferButton, {name:" Jim",onClick: function(){alert('hi')},baseUrl:baseUrl}), document.getElementById('content02'));

