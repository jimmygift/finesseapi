"use strict";

var MyComponent = React.createClass({
  displayName: "MyComponent",

  handleClick: function handleClick() {
    // Explicitly focus the text input using the raw DOM API.
    this.myTextInput.focus();
  },
  render: function render() {
    var _this = this;

    // The ref attribute adds a reference to the component to
    // this.refs when the component is mounted.
    return React.createElement(
      "div",
      null,
      React.createElement("input", { type: "text", ref: function ref(_ref) {
          return _this.myTextInput = _ref;
        } }),
      React.createElement("input", {
        type: "button",
        value: "Focus the text input",
        onClick: this.handleClick
      })
    );
  }
});

ReactDOM.render(React.createElement(MyComponent, null), document.getElementById('content01'));

