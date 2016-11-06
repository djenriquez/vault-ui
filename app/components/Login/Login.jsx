import React, { PropTypes } from 'react'
import styles from './login.css';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Settings from 'material-ui/svg-icons/action/settings';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { browserHistory } from 'react-router';
import axios from 'axios';

export default class Login extends React.Component {
    constructor(props) {
      super(props);
      this.validateAuthToken = this.validateAuthToken.bind(this);
      this.submitVaultURL = this.submitVaultURL.bind(this);
      this.renderSettingsDialog = this.renderSettingsDialog.bind(this);
      this.state = {
          show: false,
          promptForVaultUrl: false,
          authToken: "",
          vaultUrl: "",
          tempVaultUrl: "",
          errorMessage: ""
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

    validateAuthToken(e) {
        if (e.keyCode === 13) {
            console.log(`Validating auth token: ${this.state.authToken}`);
            if (!window.localStorage.getItem("vaultUrl")) {
                this.setState({errorMessage: "No Vault url specified.  Click the gear to edit your Vault url"});
                return;
            }
            axios.post(
                `${window.localStorage.getItem("vaultUrl")}/v1/auth/github/login`, 
                { "token": this.state.authToken },
                { headers: {'Access-Control-Allow-Originh': '*', 'Content-Type': 'text/plain'}}
                )
            .then((data) => {
                let accessToken = _.get(data, 'auth.client_token');
                if(accessToken) {
                    window.localStorage.setItem("vaultAccessToken",accessToken);
                    console.log(`Fetched token: ${accessToken}`);
                    window.location.href = '/';
                } else {
                    //No access token returned, error
                }
            })
            .catch(() => {
                //something went wrong
            });
            
        }
    }

    submitVaultURL(e) {
        if (e.keyCode === 13 && this.state.tempVaultUrl) {
            window.localStorage.setItem("vaultUrl", this.state.tempVaultUrl);
            this.setState({
                vaultUrl: this.state.tempVaultUrl,
                promptForVaultUrl: false
            });
        }
    }

    renderSettingsDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ promptForVaultUrl: false })}/>
        ]
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
                    onKeyDown={this.submitVaultURL}
                    onChange={(e,v)=>this.setState({tempVaultUrl: v})}
                />
            </Dialog>
        )
    }

    render () {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                {this.state.promptForVaultUrl && this.renderSettingsDialog()}
                <div className={`col-xs-12 col-sm-6 col-md-4 ${this.state.show ? styles.show : styles.hide}`}>
                    <div className="col-xs-12" id={styles.title}><img height="40" src="https://www.vaultproject.io/assets/images/favicon-16466d1a.png"></img>AULT</div>
                    <div className="row">
                        <div className="col-xs-11">
                            <TextField
                                fullWidth={true}
                                className="col-xs-12"
                                errorText={this.state.errorMessage}
                                hintText="Enter authentication token"
                                onKeyDown={this.validateAuthToken}
                                onChange={(e,v)=>this.setState({authToken: v})}
                            />
                        </div>
                        <div className="col-xs-1">
                            <IconButton tooltip="Settings" onClick={() => this.setState({promptForVaultUrl: true})}>
                                <Settings/>
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

