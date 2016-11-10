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

export default class Login extends React.Component {
    constructor(props) {
      super(props);
      this.validateAuthToken = this.validateAuthToken.bind(this);
      this.validateToken = this.validateToken.bind(this);
      this.submitVaultURL = this.submitVaultURL.bind(this);
      this.submitVaultURLEnter = this.submitVaultURLEnter.bind(this);
      this.renderSettingsDialog = this.renderSettingsDialog.bind(this);
      this.renderSelectedLoginOption = this.renderSelectedLoginOption.bind(this);
      this.validateUsernamePassword = this.validateUsernamePassword.bind(this);
      this.state = {
          show: false,
          promptForVaultUrl: false,
          authToken: "",
          vaultUrl: "",
          tempVaultUrl: "",
          errorMessage: "",
          username: "",
          password: "",
          loginMethodType: "GITHUB"
      };
    }

    componentDidMount() {
        let vaultUrl = window.localStorage.getItem("vaultUrl");
        if (!vaultUrl) {
            this.setState({
                promptForVaultUrl: true
            })
        } else {
            this.setState({
                vaultUrl: vaultUrl
            });
        }


        this.setState({ show: true});
    }

    validateUsernamePassword(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({errorMessage: "No Vault url specified.  Click the gear to edit your Vault url"});
                return;
            }
            if (!this.state.username) {
                this.setState({errorMessage: "No username provided."});
                return;
            }

            if (!this.state.password) {
                this.setState({errorMessage: "No password provided."});
                return;
            }
            axios.post('/login', {
                "VaultUrl": window.localStorage.getItem("vaultUrl"),
                "Creds": {
                    "Type": this.state.loginMethodType,
                    "Username": this.state.username,
                    "password": this.state.password
                }
            })
            .then((resp) => {
                window.localStorage.setItem('vaultAccessTokenExpiration', Date.now()+(_.get(resp, 'data.lease_duration')*1000))
                //DJ fill in the blanks here
            })
            .catch((err) => {
                console.error(err);
                this.setState({errorMessage: err.response.data})
            });
        }
    }

    validateToken(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({errorMessage: "No Vault url specified.  Click the gear to edit your Vault url"});
                return;
            }
            if (!this.state.authToken) {
                this.setState({errorMessage: "No auth token provided."});
                return;
            }
            axios.post('/login', { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Creds": {"Type": this.state.loginMethodType, "Token": this.state.authToken} })
            .then((resp) => {
                //  { client_token: '145a495d-dc52-4539-1de8-94e819ba1317',
                //   accessor: '1275f43d-1287-7df2-d17a-6956181a5238',
                //   policies: [ 'default', 'insp-power-user' ],
                //   metadata: { org: 'Openmail', username: 'djenriquez' },
                //   lease_duration: 3600,
                //   renewable: true }
                let accessToken = _.get(resp, 'data.client_token');
                if(accessToken) {
                    window.localStorage.setItem("vaultAccessToken",accessToken);
                    let leaseDuration = _.get(resp, 'data.lease_duration') === 0 ? 8640000000000000 : Date.now()+_.get(resp, 'data.lease_duration')*1000
                    window.localStorage.setItem('vaultAccessTokenExpiration', leaseDuration)
                    window.location.href = '/';
                } else {
                    this.setState({errorMessage: "Auth token validation failed."})
                }
            })
            .catch((err) => {
                console.error(err.stack);
                this.setState({errorMessage: err.response.data})
            });
        }
    }

    validateAuthToken(e) {
        if (e.keyCode === 13) {
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({errorMessage: "No Vault url specified.  Click the gear to edit your Vault url"});
                return;
            }
            if (!this.state.authToken) {
                this.setState({errorMessage: "No auth token provided."});
                return;
            }
            axios.post('/login', { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Creds": {"Type": this.state.loginMethodType, "Token": this.state.authToken} })
            .then((resp) => {
                //  { client_token: '145a495d-dc52-4539-1de8-94e819ba1317',
                //   accessor: '1275f43d-1287-7df2-d17a-6956181a5238',
                //   policies: [ 'default', 'insp-power-user' ],
                //   metadata: { org: 'Openmail', username: 'djenriquez' },
                //   lease_duration: 3600,
                //   renewable: true }
                let accessToken = _.get(resp, 'data.client_token');
                if(accessToken) {
                    window.localStorage.setItem("vaultAccessToken",accessToken);
                    window.localStorage.setItem('vaultAccessTokenExpiration', Date.now()+(_.get(resp, 'data.lease_duration')*1000))
                    window.location.href = '/';
                } else {
                    this.setState({errorMessage: "Auth token validation failed."})
                }
            })
            .catch((err) => {
                console.error(err.stack);
                this.setState({errorMessage: err.response.data})
            });
        }
    }

    submitVaultURLEnter(e) {
        if (e.keyCode === 13) {
            this.submitVaultURL()
        }
    }

    submitVaultURL(e) {
        if (this.state.tempVaultUrl) {
            window.localStorage.setItem("vaultUrl", this.state.tempVaultUrl);
            this.setState({
                vaultUrl: this.state.tempVaultUrl,
                promptForVaultUrl: false
            });
        }
    }

    renderSettingsDialog() {
        const actions = [
            <div>
                <FlatButton label="Close" primary={true} onTouchTap={() => this.setState({ promptForVaultUrl: false })}/>
                <FlatButton label="Submit" secondary={true} onTouchTap={this.submitVaultURL}/>
            </div>
        ]
        function handleSelectFieldChange(e,i,v) {
            this.setState({ loginMethodType: v, errorMessage: ""});
        }

        return (
            <Dialog
                title="Settings"
                actions={actions}
                modal={true}
                open={this.state.promptForVaultUrl}
            >
                <TextField
                    fullWidth={true}
                    className="col-xs-12"
                    defaultValue={this.state.vaultUrl}
                    hintText="Vault URL"
                    onKeyDown={this.submitVaultURLEnter}
                    onChange={(e,v)=>this.setState({tempVaultUrl: v})}
                />
            <SelectField
                style={{paddingLeft: 8}}
                value={this.state.loginMethodType}
                onChange={handleSelectFieldChange.bind(this)}
                floatingLabelText="Login Method">
                <MenuItem value={"GITHUB"} primaryText="Github"/>
                <MenuItem value={"TOKEN"} primaryText="Token"/>
                <MenuItem value={"USERNAMEPASSWORD"} primaryText="Username & Password"/>
            </SelectField>
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
                        onChange={(e,v)=>this.setState({authToken: v})}
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
                        onChange={(e,v)=>this.setState({authToken: v})}
                    />
                );
            case "USERNAMEPASSWORD":
                return (
                    <div>
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            hintText="Enter username"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e,v)=>this.setState({username: v})}
                        />
                        <TextField
                            fullWidth={true}
                            className="col-xs-12"
                            type="password"
                            hintText="Enter password"
                            onKeyDown={this.validateUsernamePassword}
                            onChange={(e,v)=>this.setState({password: v})}
                        />
                    <div className={styles.error}>{this.state.errorMessage}</div>
                    </div>
                )
        }
    }

    render () {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                {this.state.promptForVaultUrl && this.renderSettingsDialog()}
                <div className={`col-xs-12 col-sm-6 col-md-4 ${this.state.show ? styles.show : styles.hide}`}>
                    <div className="col-xs-12" id={styles.title}><img height="40" src="https://www.vaultproject.io/assets/images/favicon-16466d1a.png"></img>AULT</div>
                    <div className="row">
                        <div className="col-xs-11">
                            {this.renderSelectedLoginOption()}
                        </div>
                        <div className="col-xs-1">
                            <IconButton tooltip="Settings" onTouchTap={() => this.setState({promptForVaultUrl: true})}>
                                <Settings/>
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
