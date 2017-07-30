import React from 'react'
import axios from 'axios';
import ReactDOM from 'react-dom';
import Login from './components/Login/Login.jsx';
import { Router, Route } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { history } from './components/shared/VaultUtils.jsx';
import App from './components/App/App.jsx';
import SecretsGeneric from './components/Secrets/Generic/Generic.jsx';
import PolicyManager from './components/Policies/Manage.jsx';
import Settings from './components/Settings/Settings.jsx';
import ResponseWrapper from './components/ResponseWrapper/ResponseWrapper.jsx';
import TokenAuthBackend from './components/Authentication/Token/Token.jsx';
import AwsEc2AuthBackend from './components/Authentication/AwsEc2/AwsEc2.jsx';
import AwsAuthBackend from './components/Authentication/Aws/Aws.jsx';
import GithubAuthBackend from './components/Authentication/Github/Github.jsx';
import RadiusAuthBackend from './components/Authentication/Radius/Radius.jsx';
import UserPassAuthBackend from './components/Authentication/UserPass/UserPass.jsx';
import SecretUnwrapper from './components/shared/Wrapping/Unwrapper';
import OktaAuthBackend from './components/Authentication/Okta/Okta.jsx';

// Load here to signal webpack
import 'flexboxgrid/dist/flexboxgrid.min.css';
import './assets/favicon.ico';

injectTapEventPlugin();

(function () {

    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

const checkVaultUiServer = (nextState, replace, callback) => {
    // If it's a web deployment, query the server for default connection parameters
    // Those can be set using environment variables in the nodejs process
    if (WEBPACK_DEF_TARGET_WEB) {
        axios.get('/vaultui').then((resp) => {
            window.defaultVaultUrl = resp.data.defaultVaultUrl;
            window.defaultAuthMethod = resp.data.defaultAuthMethod;
            window.defaultBackendPath = resp.data.defaultBackendPath;
            window.suppliedAuthToken = resp.data.suppliedAuthToken;
            callback();
        }).catch(() => callback())
    } else {
        callback();
    }
}

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
        <Router history={history}>
            <Route path="/login" component={Login} onEnter={checkVaultUiServer} />
            <Route path="/unwrap" component={SecretUnwrapper} />
            <Route path="/" component={App} onEnter={checkAccessToken}>
                <Route path="/secrets/generic/:namespace(/**)" component={SecretsGeneric} />
                <Route path="/auth/token/:namespace" component={TokenAuthBackend} />
                <Route path="/auth/aws/:namespace(/**)" component={AwsAuthBackend} />
                <Route path="/auth/aws-ec2/:namespace(/**)" component={AwsEc2AuthBackend} />
                <Route path="/auth/github/:namespace(/**)" component={GithubAuthBackend} />
                <Route path="/auth/radius/:namespace(/**)" component={RadiusAuthBackend} />
                <Route path="/auth/okta/:namespace(/**)" component={OktaAuthBackend} />
                <Route path="/auth/userpass/:namespace(/**)" component={UserPassAuthBackend} />
                <Route path="/settings" component={Settings} />
                <Route path="/responsewrapper" component={ResponseWrapper} />
                <Route path="/sys/policies(/**)" component={PolicyManager} />
            </Route>
        </Router>
    </MuiThemeProvider>
), document.getElementById('app'))