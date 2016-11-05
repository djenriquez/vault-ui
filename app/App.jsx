import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom';
import Login from './components/Login/Login.jsx';
import Home from './components/Home/Home.jsx';
import { Router, Route, Link, browserHistory } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

injectTapEventPlugin();

const checkAuthToken = (nextState, replace, callback) => {
    let vaultAuthToken = window.localStorage.getItem('vaultAuthenticationToken');
    if (!vaultAuthToken) {
        replace(`/login`)
    }
    callback();
}

ReactDOM.render((
    <MuiThemeProvider>
  <Router history={browserHistory}>
      <Route path="/login" component={Login}/>
      <Route path="/" component={Home} onEnter={checkAuthToken}>
          <Route path="*" component={Login}/>
      </Route>
  </Router>
  </MuiThemeProvider>
), document.getElementById('app'))
