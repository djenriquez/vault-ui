import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom';
import Login from './components/Login/Login.jsx';
import Home from './components/Home/Home.jsx';
import { Router, Route, Link, browserHistory } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

injectTapEventPlugin();

ReactDOM.render((
    <MuiThemeProvider>
  <Router history={browserHistory}>
    <Route path="/" component={Login}>
      <Route path="/login" component={Login}/>
      <Route path="*" component={Login}/>
    </Route>
  </Router>
  </MuiThemeProvider>
), document.getElementById('app'))
