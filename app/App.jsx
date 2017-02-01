import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom';
import Login from './components/Login/Login.jsx';
import { Router, Route, Link, browserHistory } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import App from './components/App/App.jsx';
import SecretsGeneric from './components/Secrets/Generic/Generic.jsx';
import Health from './components/Health/Health.jsx';
import Policies from './components/Policies/Home.jsx';
import Settings from './components/Settings/Settings.jsx';
import ResponseWrapper from './components/ResponseWrapper/ResponseWrapper.jsx';
import TokenManage from './components/Tokens/Manage.jsx'

injectTapEventPlugin();

(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

const checkAccessToken = (nextState, replace, callback) => {
    let vaultAuthToken = window.localStorage.getItem('vaultAccessToken');
    if (!vaultAuthToken) {
        replace(`/login`)
    }
    callback();
}

const muiTheme = getMuiTheme({
  fontFamily: 'Source Sans Pro, sans-serif',
});

ReactDOM.render((
    <MuiThemeProvider muiTheme={muiTheme}>
        <Router history={browserHistory}>
            <Route path="/login" component={Login}/>
            <Route path="/" component={App} onEnter={checkAccessToken}>
                <Route path="/secrets/generic/**" component={SecretsGeneric}/>
                <Route path="/health" component={Health}/>
                <Route path="/settings" component={Settings}/>
                <Route path="/responsewrapper" component={ResponseWrapper}/>
                <Route path="/policies/:policy" component={Policies}/>
                <Route path="/tokens" component={TokenManage}/>
            </Route>
        </Router>
    </MuiThemeProvider>
), document.getElementById('app'))
