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
import PolicyManager from './components/Policies/Manage.jsx';
import Settings from './components/Settings/Settings.jsx';
import ResponseWrapper from './components/ResponseWrapper/ResponseWrapper.jsx';
import TokenAuthBackend from './components/Authentication/Token/Token.jsx'
import AwsEc2AuthBackend from './components/Authentication/AwsEc2/AwsEc2.jsx'
import GithubAuthBackend from './components/Authentication/Github/Github.jsx'

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
        replace(`/login?returnto=${encodeURI(nextState.location.pathname)}`)
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
                <Route path="/secrets/generic/:namespace(/**)" component={SecretsGeneric}/>
                <Route path="/auth/token/:namespace" component={TokenAuthBackend}/>
                <Route path="/auth/aws-ec2/:namespace" component={AwsEc2AuthBackend}/>
                <Route path="/auth/github/:namespace" component={GithubAuthBackend}/>
                <Route path="/health" component={Health}/>
                <Route path="/settings" component={Settings}/>
                <Route path="/responsewrapper" component={ResponseWrapper}/>
                <Route path="/sys/policies(/**)" component={PolicyManager}/>
            </Route>
        </Router>
    </MuiThemeProvider>
), document.getElementById('app'))
