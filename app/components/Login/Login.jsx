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
            axios.post('/login', { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Creds": {"Type": "GITHUB", "Token": this.state.authToken} })
            .then((resp) => {
//                 { client_token: '145a495d-dc52-4539-1de8-94e819ba1317',
//   accessor: '1275f43d-1287-7df2-d17a-6956181a5238',
//   policies: [ 'default', 'insp-power-user' ],
//   metadata: { org: 'Openmail', username: 'djenriquez' },
//   lease_duration: 3600,
//   renewable: true }
                let accessToken = _.get(resp, 'data.client_token');
                if(accessToken) {
                    window.localStorage.setItem("vaultAccessToken",accessToken);
                    console.log(`Fetched token: ${accessToken}`);
                    window.location.href = '/';
                } else {
                    //No access token returned, error
                }
            })
            .catch((err) => {
                console.error(err.stack);
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

