import React, { PropTypes } from 'react'
import styles from './login.css';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Settings from 'material-ui/svg-icons/action/settings';
import Dialog from 'material-ui/Dialog';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import _ from 'lodash';
import { callVaultApi, history } from '../shared/VaultUtils.jsx';
import logoImage from '../../assets/vault-ui-logo.svg';

export default class Login extends React.Component {
    static propTypes = {
        location: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            show: false,
            openSettings: false,
            authToken: "",
            vaultUrl: this.getVaultUrl(),
            tmpVaultUrl: "",
            errorMessage: "",
            username: "",
            password: "",
            loginMethodType: this.getVaultAuthMethod(),
            tmpLoginMethodType: this.getVaultAuthMethod(),
            authBackendPath: this.getAuthBackendPath(),
            tmpAuthBackendPath: this.getAuthBackendPath(),
            settingsChanged: false,
        };

        _.bindAll(
            this,
            'validateAuthToken',
            'getAuthBackendPath',
            'validateToken',
            'getDefaultBackendPathForMethod',
            'submitSettings',
            'renderSettingsDialog',
            'renderSelectedLoginOption',
            'validateUsernamePassword',
            'checkSettings',
            'login'
        )
    }

    componentDidMount() {
        // If a token was supplied in the window.suppliedAuthToken variable, then simulate a login
        if (window.suppliedAuthToken && this.state.vaultUrl) {
            this.setState({
                loginMethodType: 'TOKEN',
                authToken: window.suppliedAuthToken
            }, () => {
                this.validateToken({ keyCode: 13 });
            });
        } else {
            this.setState({ show: true });
            if (!this.state.vaultUrl) {
                this.setState({
                    openSettings: true
                });
            }
        }
    }

    getVaultUrl() {
        if (window.localStorage.getItem("vaultUrl"))
            return window.localStorage.getItem("vaultUrl");
        else
            return window.defaultVaultUrl;
    }

    getVaultAuthMethod() {
        if (window.localStorage.getItem("loginMethodType"))
            return window.localStorage.getItem("loginMethodType");
        else
            return window.defaultAuthMethod;
    }

    getDefaultBackendPathForMethod(type) {
        switch (type) {
            case 'TOKEN':
                return 'token'
            case 'GITHUB':
                return 'github'
            case 'LDAP':
                return 'ldap'
            case 'USERNAMEPASSWORD':
                return 'userpass'
            case 'OKTA':
                return 'okta'
            default:
                return ''
        }
    }

    getAuthBackendPath() {
        if (window.localStorage.getItem("loginBackendPath"))
            return window.localStorage.getItem("loginBackendPath");
        else if (window.defaultBackendPath)
            return window.defaultBackendPath;
        else
            return this.getDefaultBackendPathForMethod(this.getVaultAuthMethod())
    }

    login() {
        let method = '';
        let uri = '';
        let data = null;

        switch (this.state.loginMethodType) {
            case "TOKEN":
                method = 'get';
                uri = `auth/${this.state.authBackendPath}/lookup-self`;
                break;
            case "GITHUB":
                method = 'post';
                uri = `auth/${this.state.authBackendPath}/login`;
                data = { token: this.state.authToken };
                break;
            case "LDAP":
                method = 'post';
                uri = `auth/${this.state.authBackendPath}/login/${this.state.username}`;
                data = { password: this.state.password };
                break;
            case "USERNAMEPASSWORD":
                method = 'post';
                uri = `auth/${this.state.authBackendPath}/login/${this.state.username}`;
                data = { password: this.state.password };
                break;
            case "OKTA":
                method = 'post';
                uri = `auth/${this.state.authBackendPath}/login/${this.state.username}`;
                data = { password: this.state.password };
                break;
            default:
                throw new Error(`Login method type: '${this.state.loginMethodType}' is not supported`);
        }

        callVaultApi(method, uri, null, data, null, this.state.loginMethodType == 'TOKEN' ? this.state.authToken : null, this.state.vaultUrl)
            .then((resp) => {
                if (this.state.loginMethodType == "TOKEN") {
                    this.setAccessToken({
                        client_token: resp.data.data.id,
                        lease_duration: resp.data.lease_duration
                    });
                } else {
                    this.setAccessToken(resp.data.auth);
                }
            })
            .catch((error) => {
                var loginErrorMessage;
                if (_.has(error, 'response.data.errors') &&
                    error.response.data.errors.length > 0) {
                    loginErrorMessage = _.join(error.response.data.errors, ", ");
                } else {
                    loginErrorMessage = error.message;
                }
                this.setState({ errorMessage: `Error: ${loginErrorMessage}` });
            });
    }

    validateUsernamePassword(e) {
        if (e.keyCode === 13) {
            if (!this.getVaultUrl()) {
                this.setState({ errorMessage: "No Vault URL specified.  Click the gear to edit your Vault URL." });
                return;
            }
            if (!this.state.username) {
                this.setState({ errorMessage: "No username provided." });
                return;
            }

            if (!this.state.password) {
                this.setState({ errorMessage: "No password provided." });
                return;
            }

            this.login();
        }
    }

    validateToken(e) {
        if (e.keyCode === 13) {
            if (!this.getVaultUrl()) {
                this.setState({ errorMessage: "No Vault URL specified.  Click the gear to edit your Vault URL." });
                return;
            }
            if (!this.state.authToken) {
                this.setState({ errorMessage: "No auth token provided." });
                return;
            }
            this.login();
        }
    }

    validateAuthToken(e) {
        if (e.keyCode === 13) {
            if (!this.getVaultUrl()) {
                this.setState({ errorMessage: "No Vault URL specified.  Click the gear to edit your Vault URL." });
                return;
            }
            if (!this.state.authToken) {
                this.setState({ errorMessage: "No auth token provided." });
                return;
            }

            this.login();
        }
    }

    setAccessToken(resp) {
        let accessToken = _.get(resp, 'client_token');
        if (accessToken) {
            window.localStorage.setItem('capability_cache', JSON.stringify({}));
            window.localStorage.setItem("vaultAccessToken", accessToken);
            window.localStorage.setItem('vaultUrl', this.getVaultUrl());
            window.localStorage.setItem('loginMethodType', this.getVaultAuthMethod());
            window.localStorage.setItem('loginBackendPath', this.getAuthBackendPath());
            if (this.props.location.query.returnto && this.props.location.query.returnto.indexOf('/') === 0)
                history.push(this.props.location.query.returnto);
            else
                history.push('/');
        } else {
            this.setState({ errorMessage: "Unable to obtain access token." })
        }
    }

    submitSettings() {
        if (this.state.settingsChanged) {
            if (!this.state.tmpVaultUrl) {
                this.setState({ errorMessage: 'Please enter a Vault URL' });
            }
            else if (!this.state.tmpLoginMethodType) {
                this.setState({ errorMessage: 'Please select an authentication backend' });
            } else if (!this.state.tmpAuthBackendPath) {
                this.setState({ errorMessage: 'Please select a valid path for the authentication backend' })
            } else {
                window.localStorage.setItem("vaultUrl", this.state.tmpVaultUrl);
                window.localStorage.setItem("loginMethodType", this.state.tmpLoginMethodType);
                window.localStorage.setItem('loginBackendPath', this.state.tmpAuthBackendPath);
                this.setState({
                    errorMessage: '',
                    vaultUrl: this.state.tmpVaultUrl,
                    loginMethodType: this.state.tmpLoginMethodType,
                    authBackendPath: this.state.tmpAuthBackendPath,
                    openSettings: false
                });
            }
        } else {
            this.setState({ openSettings: false });
        }
    }

    checkSettings() {
        this.setState({
            errorMessage: this.state.vaultUrl ? '' : 'No Vault URL specified.  Click the gear to edit your Vault URL.',
            openSettings: false
        });
    }

    renderSettingsDialog() {
        const actions = [
            <div>
                <FlatButton label="Close" primary={true} onTouchTap={this.checkSettings} />
                <FlatButton label="Submit" secondary={true} onTouchTap={this.submitSettings} />
            </div>
        ]

        let handleSelectFieldChange = (e, i, v) => {
            this.setState({ tmpLoginMethodType: v, tmpAuthBackendPath: this.getDefaultBackendPathForMethod(v), settingsChanged: true });
        }

        return (
            <Dialog
                title="Authentication Settings"
                actions={actions}
                autoScrollBodyContent={true}
                modal={true}
                open={this.state.openSettings}
            >
                <div>
                    <TextField
                        id="vaultUrl"
                        fullWidth={true}
                        className="col-xs-12"
                        floatingLabelFixed={true}
                        floatingLabelText="Vault Server URL"
                        defaultValue={this.state.vaultUrl}
                        onChange={(e, v) => this.setState({ tmpVaultUrl: v, settingsChanged: true })}
                    />
                </div>
                <div>
                    <SelectField
                        style={{ paddingLeft: 8 }}
                        value={this.state.tmpLoginMethodType}
                        onChange={handleSelectFieldChange.bind(this)}
                        floatingLabelText="Login Method">
                        <MenuItem value={"GITHUB"} primaryText="Github" />
                        <MenuItem value={"TOKEN"} primaryText="Token" />
                        <MenuItem value={"LDAP"} primaryText="LDAP" />
                        <MenuItem value={"USERNAMEPASSWORD"} primaryText="Username & Password" />
                        <MenuItem value={"OKTA"} primaryText="Okta" />
                    </SelectField>
                </div>
                <div>
                    <Card initiallyExpanded={false}>
                        <CardHeader title="Advanced Options" actAsExpander={true} showExpandableButton={true} />
                        <CardText expandable={true}>
                            <TextField
                                style={{ paddingLeft: 8 }}
                                id="backendPath"
                                floatingLabelFixed={true}
                                floatingLabelText="Auth backend path"
                                value={this.state.tmpAuthBackendPath}
                                onChange={(e, v) => this.setState({ tmpAuthBackendPath: v, settingsChanged: true })}
                            />
                        </CardText>
                    </Card>
                </div>
                <div className={styles.error}>{this.state.errorMessage}</div>
            </Dialog>
        )
    }

    renderSelectedLoginOption() {
        switch (this.state.loginMethodType) {
            case "GITHUB":
                return (
                    <TextField
                        fullWidth={true}
                        className="col-xs-12"
                        errorText={this.state.errorMessage}
                        hintText="Enter Github token"
                        onKeyDown={this.validateAuthToken}
                        onChange={(e, v) => this.setState({ authToken: v })}
                    />
                );
            case "TOKEN":
                return (
                    <TextField
                        fullWidth={true}
                        className="col-xs-12"
                        errorText={this.state.errorMessage}
                        hintText="Enter token"
                        onKeyDown={this.validateToken}
                        onChange={(e, v) => this.setState({ authToken: v })}
                    />
                );
            case "LDAP":
                return (
                    <div>
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            hintText="Enter LDAP username"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ username: v })}
                        />
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            type="password"
                            hintText="Enter LDAP password"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ password: v })}
                        />
                        <div className={styles.error}>{this.state.errorMessage}</div>
                    </div>
                );
            case "USERNAMEPASSWORD":
                return (
                    <div>
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            hintText="Enter username"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ username: v })}
                        />
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            type="password"
                            hintText="Enter password"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ password: v })}
                        />
                        <div className={styles.error}>{this.state.errorMessage}</div>
                    </div>
                );
            case "OKTA":
                return (
                    <div>
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            hintText="Enter username"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ username: v })}
                        />
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            type="password"
                            hintText="Enter password"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e, v) => this.setState({ password: v })}
                        />
                        <div className={styles.error}>{this.state.errorMessage}</div>
                    </div>
                );
        }
    }

    render() {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                {this.state.openSettings && this.renderSettingsDialog()}
                <div className={`col-xs-12 col-sm-6 col-md-4`}>
                    <div className="col-xs-12" id={styles.title}><img height="40" src={logoImage}></img>AULT - UI</div>
                    <div className="row">
                        <div className="col-xs-11">
                            {this.renderSelectedLoginOption()}
                        </div>
                        <div className="col-xs-1">
                            <IconButton tooltip="Settings" onTouchTap={() => {
                                this.setState({
                                    errorMessage: '',
                                    openSettings: true,
                                    tmpLoginMethodType: this.state.loginMethodType,
                                    tmpVaultUrl: this.state.vaultUrl,
                                    tmpAuthBackendPath: this.state.authBackendPath
                                })
                            }}>
                                <Settings />
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
