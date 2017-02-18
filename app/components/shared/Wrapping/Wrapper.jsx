import React, { PropTypes, Component } from 'react'
import _ from 'lodash';
import { callVaultApi } from '../VaultUtils.jsx'
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import copy from 'copy-to-clipboard';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import sharedStyles from '../styles.css';

export default class SecretWrapper extends Component {
    static propTypes = {
        path: PropTypes.string,
        onReceiveResponse: PropTypes.func,
        onReceiveError: PropTypes.func,
        onModalClose: PropTypes.func
    }

    static defaultProps = {
        path: null,
        onReceiveResponse: () => { },
        onReceiveError: () => { },
        onModalClose: () => { }
    }

    constructor(props) {
        super(props)
    }

    state = {
        wrapInfo: {},
    };

    componentDidUpdate(prevProps) {
        if (!_.isEqual(prevProps.path, this.props.path) && this.props.path) {
            callVaultApi('get', this.props.path, null, null, { 'X-Vault-Wrap-TTL': '10m' })
                .then((response) => {
                    this.setState({ wrapInfo: response.data.wrap_info });
                    this.props.onReceiveResponse(response.data.wrap_info);
                })
                .catch((err) => {
                    this.props.onReceiveError(err);
                })
        }
    }

    render() {
        let vaultUrl = encodeURI(window.localStorage.getItem("vaultUrl"));
        let tokenValue = '';
        let urlValue = '';
        if (this.state.wrapInfo) {
            let loc = window.location;
            tokenValue = this.state.wrapInfo.token;
            urlValue = `${loc.protocol}//${loc.hostname}${(loc.port ? ":" + loc.port : "")}/unwrap?token=${tokenValue}&vaultUrl=${vaultUrl}`;
        }

        return (
            <Dialog
                title="Data has been wrapped"
                modal={true}
                open={!_.isEmpty(this.state.wrapInfo)}
                actions={<FlatButton label="Close" primary={true} onTouchTap={() => {this.props.onModalClose(); this.setState({ wrapInfo: {} })}} />}
                onRequestClose={this.props.onModalClose}
            >
                <div className={sharedStyles.newTokenCodeEmitted}>
                        <TextField
                            fullWidth={true}
                            disabled={true}
                            floatingLabelText="This is a single-use unwrap token to read the wrapped data"
                            defaultValue={tokenValue}
                        />
                        <RaisedButton icon={<FontIcon className="fa fa-clipboard" />} label="Copy to Clipboard" onTouchTap={() => { copy(tokenValue) }} />
                </div >
                <div className={sharedStyles.newUrlEmitted}>
                    <TextField
                        fullWidth={true}
                        disabled={true}
                        floatingLabelText="Use this URL if you want to display the wrapped data using Vault UI"
                        defaultValue={urlValue}
                    />
                    <RaisedButton icon={<FontIcon className="fa fa-clipboard" />} label="Copy to Clipboard" onTouchTap={() => { copy(urlValue) }} />
                </div>
            </Dialog >
        )
    }
}