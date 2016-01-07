
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

function userIdIsValid(id){
  if (id && id !=='000000'){
    return true;
  } else {
    return false;
  }
};

var BadgeInstance = React.createClass({
  render: function() {
    return (
      <h5><ReactBootstrap.Label>{this.props.label}</ReactBootstrap.Label>  {this.props.text}</h5>
    )
    //return (<p><ReactBootstrap.Badge>{this.props.label}</ReactBootstrap.Badge>  {this.props.text}</p>)
  }
});

var BadgeInstance01 =  React.createElement(BadgeInstance, {key:1, label:"1", text:"Atencion inicial"});
var BadgeInstance02 =  React.createElement(BadgeInstance, {key:2, label:"2", text:"Atencion"});
var BadgeInstance03 =  React.createElement(BadgeInstance, {key:3, label:"3", text:"Asignar ticket"});
var BadgeInstance04 =  React.createElement(BadgeInstance, {key:4, label:"4", text:"Transferir a encuesta"});

var agentSpeechText01 =  `Gracias por llamar a Enlace
Mi nombre es ___
Tengo el gusto con ___ ?
Su numero de nomina es ___ ?
Por motivos de seguridad, me puede proporcionar su fecha de nacimiento ?
Gracias por la informacion. Como te puedo ayudar el dia de hoy ?
`;

var agentSpeechText0102 =  `Gracias por llamar a Enlace.
Mi nombre es ___.
Con quien tengo el gusto ?
Para ayudarlo mejor me proporciona su numero de nomina o GPID por favor ?
Por motivos de seguridad, me puede proporcionar su fecha de nacimiento ?
Gracias por la informacion. Como te puedo ayudar el dia de hoy ?
`;

var agentSpeechText02 = `Cuando se presento ese problema
A que hora marcaste ?
Enviaste correo a Pepsico Enlace ?
Haz llamado a enlace sobre este tema anteriormente ?
Que error te aparece ?
Lo haz consultado con tu generalista o jefe directo ?
Cuando entregaste tu Carta de Retencion ?
A que herramienta estas intentando entrar ?
Haz tenido faltas o incapacidades recientemente ?
Te ayudaron a hacer el tramite en tu portal o lo hiciste solo ?
Ya habias mandado papeleria ? cuando? a donde ?
Esta llamada se registrara con un ticket numero ___, este no es un ticket adicional, solamente es un registro de su llamada
`;

var agentSpeechText03 =  `La solucion que nos brinda el area de ___ es ___
Todavia no tenemos una respuesta dado que el area sigue trabajando en tu tema, estos procesos normalmente ...
Si revisamos tu solicitud, para poder solucionarlo por completo requerimos tu apoyo en enviarnos ___
Por el momento no sera posible ___ dado que por politica el area de ___ establece que ___
`;

var agentSpeechText04 = `Por lo tanto, requeriremos se comunique ___ y entonces ya recibiremos el dato solicitado, le parece ?
Entonces en cuanto nos envie el dato, se procesara la solicitud y podremos finalizar su requerimento, ok ?
Daremos seguimiento al ticket y en cuanto tengamos una respuesta le llegará un correo de notificacion de que se cerro el ticket. Si gusta se puede comunicar con nosotros para revisarlo a detalle, esta bien ?
Algo mas en lo que le pueda ayudar ?
Esta llamada se registrara con un ticket #___ este no es un ticket adicional, solamente es un registro de su llamada
`;

var agentSpeechText05 = `
Le pido 30 segundos mas de su tiempo para una encuesta muy breve de dos preguntitas para evaluar mi servicio y la resolucion por parte de Servicios al Personal ok ?
Muchas gracias por llamar a Enlace, estamos a sus ordenes`

// <span className="glyphicon glyphicon-user"></span>
// {agentSpeechText03.split("\n").map(function(i){return (<span>{i}<br/></span>) } ) }
var AgentSpeech = React.createClass({
  render: function() {
    var textNodes = this.props.text.split("\n").map(function(i){ return (<span>{i}<br/></span>)});
    //console.log("Text: " + JSON.stringify(text) + " Type " + typeof(text))

    return(
        <div>
        <p>{textNodes}</p>
        </div>
    );
  }
});

var AgentSpeech01 = React.createElement(AgentSpeech,{text:agentSpeechText01});

// <span className="glyphicon glyphicon-user"></span>
var AgentSpeech00 = React.createClass({
  render: function() {
    return(
      <div>
        <ReactBootstrap.Table responsive>
          <tbody><tr><td>{this.props.text.split("\n").map(function(i){return ({i})}) }</td></tr></tbody>
        </ReactBootstrap.Table>
      </div>
    );
  }
});

var TransferCall  = React.createClass({
  handleClick: function(e) {
    //var handlers = {success:this.onSuccess, error:this.onError};
    //this.props.onClick(e);
    //_REST.httpRequest('GET',this.props.baseUrl,'/clientConfig',{},handlers);

    finesse.modules.CiscoFinesseGadget.startCallTransfer();
  },

  render: function(){
    return(
      <div>
        <ReactBootstrap.Button bsStyle="primary" onClick={this.handleClick}>Transferir llamada</ReactBootstrap.Button>
      </div>
    );
  }
});

var TicketNumber  = React.createClass({

  getInitialState: function(){
    return {
      ticketNumber: ''
    };
  },

  setTicketNumber: function(val){
    this.state.ticketNumber=val;
  },

  handleClick: function(e){
    finesse.modules.CiscoFinesseGadget.setTicketNumber(this.state.ticketNumber);
    this.state.ticketNumber = '';
    alert('Ticket asignado');
  },

  render: function(){
    return(
      <div>
        <InputField onChange={this.setTicketNumber}/>
        <ReactBootstrap.Button bsStyle="primary" onClick={this.handleClick}>Asignar ticket</ReactBootstrap.Button>
      </div>
    );
  }
});

var InputField = React.createClass({
  getInitialState: function() {
    return {
      value: ''
    };
  },

  validationState: function() {
    var length = this.state.value.length;
    if (length > 10) return 'success';
    else if (length > 5) return 'warning';
    else if (length > 0) return 'error';
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
        value={this.state.value}
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

// {"acdIncomingCall":true,"acdCallUsername":"TREJO COPADO LUIS FERNANDO","acdCallUserid":"604952"}
// React Callback: {"acdIncomingCall":true,"acdCallUsername":"TREJO COPADO LUIS FERNANDO","acdCallUserid":"604952"}

var TransferButton = React.createClass({
  getInitialState: function() {
    return {active: true,
            activeKey: '1',
            acdCallUserid: '',
            acdCallUsername: '',
            acdIncomingCall: '',
            callState: '',
            ticketNumber: ''
           };
  },

  // Create Callback on Cisco Finesse Gadget

  componentWillMount: function(){
    globalVar.reactCallback = function(data){
      //alert('React Callback: ' + data.acdCallUserid );
      //alert('This :' + JSON.stringify(this));
      this.setState({acdCallUserid: data.acdCallUserid});
      alert('New State: ' +  this.state.acdCallUserid );
    };
  },

  componentDidMount: function(){
      //alert('Mounted component');
  },

  onSuccess: function(rsp){
    // {"status":200,"content":"{\"gadgetServerHost\":\"11.8.75.75\",\"gadgetServerPort\":\"8082\"}"}
    alert(JSON.stringify(rsp));
  },

  onError: function(rsp){
  },

  handleClick: function(e) {
    var handlers = {success:this.onSuccess, error:this.onError};

    this.props.onClick(e);
    _REST.httpRequest('GET',this.props.baseUrl,'/clientConfig',{},handlers);
  },

  _getLastContactsSuccess: function(){

  },

  _getLastContactsError:  function(){

  },

  handleSelect: function(activeKey){
    this.setState({activeKey});
  },

  // userIdIsValid(this.state.acdCallUserid)
  render: function render() {
    return (
      <div>
      <ReactBootstrap.PanelGroup activeKey={this.state.activeKey} onSelect={this.handleSelect} accordion>
        <ReactBootstrap.Panel header="Bienvenida" eventKey="1">
          <ReactBootstrap.Panel header="Speech">
            <AgentSpeech text={ userIdIsValid(this.state.acdCallUserid) ? agentSpeechText01 : agentSpeechText0102 } />
          </ReactBootstrap.Panel>
        </ReactBootstrap.Panel>
        <ReactBootstrap.Panel header="Indagación" eventKey="2">
          <ReactBootstrap.Panel header="Speech">
            <AgentSpeech text={agentSpeechText02} />
          </ReactBootstrap.Panel>
        </ReactBootstrap.Panel>
        <ReactBootstrap.Panel header="Resolución" eventKey="3">
          <ReactBootstrap.Panel header="Speech">
            <AgentSpeech text={agentSpeechText03} />
          </ReactBootstrap.Panel>
        </ReactBootstrap.Panel>
        <ReactBootstrap.Panel header="Cierre" eventKey="4">
          <ReactBootstrap.Panel header="Speech">
            <AgentSpeech text={agentSpeechText04} />
          </ReactBootstrap.Panel>
        </ReactBootstrap.Panel>
        <ReactBootstrap.Panel header="Asignar ticket y enviar a encuesta" eventKey="5">
          <ReactBootstrap.Panel header="Speech">
            <AgentSpeech text={agentSpeechText05} />
          </ReactBootstrap.Panel>
          <ReactBootstrap.Panel header="Asignacion de ticket">
            <TicketNumber/>
          </ReactBootstrap.Panel>
          <ReactBootstrap.Panel header="Encuesta de evaluacion">
            <TransferCall/>
          </ReactBootstrap.Panel>
        </ReactBootstrap.Panel>
      </ReactBootstrap.PanelGroup>
      </div>
    );
    //return React.createElement('div',{onClick: this.handleClick},'Hello ',this.props.name);
  }
});

//ReactDOM.render(React.createElement(TransferButton, {name:" Jim",onClick: function(){alert('hi')},baseUrl:baseUrl}), document.getElementById('content02'));
