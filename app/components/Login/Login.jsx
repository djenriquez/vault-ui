import React, { PropTypes } from 'react'
import styles from './login.css';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Settings from 'material-ui/svg-icons/action/settings';
import Dialog from 'material-ui/Dialog';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import { browserHistory } from 'react-router';
import axios from 'axios';
import _ from 'lodash';

export default class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            show: false,
            openSettings: false,
            authToken: "",
            vaultUrl: window.localStorage.getItem("vaultUrl") || window.defaultUrl,
            tmpVaultUrl: "",
            errorMessage: "",
            username: "",
            password: "",
            loginMethodType: window.localStorage.getItem("loginMethodType") || "GITHUB",
            tmpLoginMethodType: window.localStorage.getItem("loginMethodType") || "GITHUB",
            settingsChanged: false
        };

        _.bindAll(
            this,
            'validateAuthToken',
            'validateToken',
            'submitSettings',
            'renderSettingsDialog',
            'renderSelectedLoginOption',
            'validateUsernamePassword',
            'checkSettings'
        )
    }

    componentDidMount() {
        this.setState({ show: true });
        if (!this.state.vaultUrl) {
            this.setState({
                openSettings: true
            });
        }
    }

    validateUsernamePassword(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
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
            axios.post('/login', {
                "VaultUrl": window.localStorage.getItem("vaultUrl"),
                "Creds": {
                    "Type": this.state.loginMethodType,
                    "Username": this.state.username,
                    "Password": this.state.password
                }
            })
                .then((resp) => {
                    this.setAccessToken(resp);
                })
                .catch((err) => {
                    console.error(err);
                    this.setState({ errorMessage: err.response.data })
                });
        }
    }

    validateToken(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({ errorMessage: "No Vault URL specified.  Click the gear to edit your Vault URL." });
                return;
            }
            if (!this.state.authToken) {
                this.setState({ errorMessage: "No auth token provided." });
                return;
            }
            axios.post('/login', { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Creds": { "Type": this.state.loginMethodType, "Token": this.state.authToken } })
                .then((resp) => {
                    this.setAccessToken(resp);
                })
                .catch((err) => {
                    console.error(err.stack);
                    this.setState({ errorMessage: err.response.data })
                });
        }
    }

    validateAuthToken(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({ errorMessage: "No Vault URL specified.  Click the gear to edit your Vault URL." });
                return;
            }
            if (!this.state.authToken) {
                this.setState({ errorMessage: "No auth token provided." });
                return;
            }
            axios.post('/login', { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Creds": { "Type": this.state.loginMethodType, "Token": this.state.authToken } })
                .then((resp) => {
                    this.setAccessToken(resp);
                })
                .catch((err) => {
                    console.error(err.stack);
                    this.setState({ errorMessage: err.response.data })
                });
        }
    }

    setAccessToken(resp) {
        //  { client_token: '145a495d-dc52-4539-1de8-94e819ba1317',
        //   accessor: '1275f43d-1287-7df2-d17a-6956181a5238',
        //   policies: [ 'default', 'insp-power-user' ],
        //   metadata: { org: 'Openmail', username: 'djenriquez' },
        //   lease_duration: 3600,
        //   renewable: true }
        let accessToken = _.get(resp, 'data.client_token');
        if (accessToken) {
            window.localStorage.setItem("vaultAccessToken", accessToken);
            let leaseDuration = _.get(resp, 'data.lease_duration') === 0 ? -1 : _.get(resp, 'data.lease_duration') * 1000
            window.localStorage.setItem('vaultAccessTokenExpiration', leaseDuration)
            window.location.href = '/';
        } else {
            this.setState({ errorMessage: "Unable to obtain access token." })
        }
    }

    submitSettings(e) {
        if (this.state.settingsChanged) {
            if (!this.state.tmpVaultUrl) {
                this.setState({ errorMessage: 'Please enter a Vault URL' });
            }
            else if (!this.state.tmpLoginMethodType) {
                this.setState({ errorMessage: 'Please select an authentication backend' });
            } else {
                window.localStorage.setItem("vaultUrl", this.state.tmpVaultUrl);
                window.localStorage.setItem("loginMethodType", this.state.tmpLoginMethodType);
                this.setState({
                    errorMessage: '',
                    vaultUrl: this.state.tmpVaultUrl,
                    loginMethodType: this.state.tmpLoginMethodType,
                    openSettings: false
                });
            }
        } else {
            this.setState({ openSettings: false });
        }
    }

    checkSettings(e) {
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
            this.setState({ tmpLoginMethodType: v, settingsChanged: true });
        }

        return (
            <Dialog
                title="Settings"
                actions={actions}
                modal={true}
                open={this.state.openSettings}
                >
                <TextField
                    id="vaultUrl"
                    fullWidth={true}
                    className="col-xs-12"
                    defaultValue={this.state.vaultUrl}
                    onChange={(e, v) => this.setState({ tmpVaultUrl: v, settingsChanged: true })}
                    />
                <SelectField
                    style={{ paddingLeft: 8 }}
                    value={this.state.tmpLoginMethodType}
                    onChange={handleSelectFieldChange.bind(this)}
                    floatingLabelText="Login Method">
                    <MenuItem value={"GITHUB"} primaryText="Github" />
                    <MenuItem value={"TOKEN"} primaryText="Token" />
                    <MenuItem value={"LDAP"} primaryText="LDAP" />
                    <MenuItem value={"USERNAMEPASSWORD"} primaryText="Username & Password" />
                </SelectField>
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
                )
        }
    }

    render() {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                {this.state.openSettings && this.renderSettingsDialog()}
                <div className={`col-xs-12 col-sm-6 col-md-4 ${this.state.show ? styles.show : styles.hide}`}>
                    <div className="col-xs-12" id={styles.title}><img height="40" src="https://www.vaultproject.io/assets/images/favicon-16466d1a.png"></img>AULT</div>
                    <div className="row">
                        <div className="col-xs-11">
                            {this.renderSelectedLoginOption()}
                        </div>
                        <div className="col-xs-1">
                            <IconButton tooltip="Settings" onTouchTap={() => this.setState({ openSettings: true, tmpLoginMethodType: this.state.loginMethodType, tmpVaultUrl: this.state.vaultUrl })}>
                                <Settings />
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
