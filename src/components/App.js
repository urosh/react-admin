import React, { Component } from 'react';
import '../App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Market Notifications</h2>
        </div>
        <div>{this.props.children}</div>
      </div>
    );
  }
}

export default App;
