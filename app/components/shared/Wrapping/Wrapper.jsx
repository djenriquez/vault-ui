import React, { PropTypes, Component } from 'react'
import _ from 'lodash';
import { callVaultApi } from '../VaultUtils.jsx'
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import copy from 'copy-to-clipboard';
import FlatButton from 'material-ui/FlatButton';
import Divider from 'material-ui/Divider';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import ContentContentCopy from 'material-ui/svg-icons/content/content-copy';
import styles from './wrapping.css'
import sharedStyles from '../styles.css';

const RETURN_KEY = 13;

export default class SecretWrapper extends Component {
    static propTypes = {
        buttonLabel: PropTypes.string,
        showButton: PropTypes.bool,
        onButtonTouchTap: PropTypes.func,
        path: PropTypes.string,
        data: PropTypes.object,
        onReceiveResponse: PropTypes.func,
        onReceiveError: PropTypes.func,
        onModalClose: PropTypes.func
    }

    static defaultProps = {
        buttonLabel: 'Wrap',
        showButton: true,
        onButtonTouchTap: null,
        path: null,
        data: null,
        onReceiveResponse: () => { },
        onReceiveError: () => { },
        onModalClose: () => { }
    }

    constructor(props) {
        super(props)
    }

    state = {
        wrapInfo: {},
        openPopover: false,
        customTtl: '',
        ttl: '5m',
        data: null,
        path: null
    };

    componentWillReceiveProps (nextProps) {
        // Trigger automatically on props change if the builtin button is not used
        if(!this.props.showButton) {
            if (!_.isEqual(nextProps.path, this.props.path) && this.props.path) {
                this.setState({ path: nextProps.path})
            } else if (!_.isEqual(nextProps.data, this.props.data) && this.props.data) {
                this.setState({ data: nextProps.data})
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!_.isEqual(prevState.path, this.state.path) && this.state.path) {
            callVaultApi('get', this.state.path, null, null, { 'X-Vault-Wrap-TTL': this.state.ttl })
                .then((response) => {
                    this.setState({ wrapInfo: response.data.wrap_info, path: null });
                    this.props.onReceiveResponse(response.data.wrap_info);
                })
                .catch((err) => {
                    this.props.onReceiveError(err);
                })
        } else if (!_.isEqual(prevState.data, this.state.data) && this.state.data) {
            callVaultApi('post', 'sys/wrapping/wrap', null, this.state.data, { 'X-Vault-Wrap-TTL': this.state.ttl })
                .then((response) => {
                    this.setState({ wrapInfo: response.data.wrap_info, data: null });
                    this.props.onReceiveResponse(response.data.wrap_info);
                })
                .catch((err) => {
                    this.props.onReceiveError(err);
                })
        }
    }

    handleTouchTap = (event) => {
        event.preventDefault();

        this.setState({
            anchorEl: event.currentTarget,
            openPopover: true
        });
    };

    handleRequestClose = () => {
        this.setState({
            openPopover: false
        });
    };

    handleItemTouchTap = (event, menuItem) => {
        this.setState({
            openPopover: false,
            ttl: menuItem.props.secondaryText,
            data: this.props.data,
            path: this.props.path
        });
    };

    handleCustomTtl = (e, v) => {
        if (e.keyCode === RETURN_KEY) {
            let customTtl = this.state.customTtl;
            this.setState({
                openPopover: false,
                ttl: customTtl,
                customTtl: '',
                data: this.props.data,
                path: this.props.path
            });
        }
    }

    render() {
        let vaultUrl = encodeURI(window.localStorage.getItem("vaultUrl"));
        let tokenValue = '';
        let urlValue = '';
        if (this.state.wrapInfo) {
            let loc = window.location;
            tokenValue = this.state.wrapInfo.token;
            if(WEBPACK_DEF_TARGET_WEB) {
                urlValue = `${loc.protocol}//${loc.hostname}${(loc.port ? ":" + loc.port : "")}/unwrap?token=${tokenValue}&vaultUrl=${vaultUrl}`;
            } else {
                urlValue = `vaultui://#/unwrap~token=${tokenValue}&vaultUrl=${vaultUrl}`;
            }
        }

        return (
            <div style={{display: 'inline-block'}}>
                {this.props.showButton &&
                    <div>
                        <RaisedButton secondary={true} label={this.props.buttonLabel} onTouchTap={this.handleTouchTap} />
                        <Popover
                            anchorEl={this.state.anchorEl}
                            open={this.state.openPopover}
                            onRequestClose={this.handleRequestClose}
                            anchorOrigin={{ "horizontal": "right", "vertical": "top" }}
                            targetOrigin={{"horizontal":"right","vertical":"bottom"}}
                        >
                            <Menu onItemTouchTap={this.handleItemTouchTap} disableAutoFocus>
                                <MenuItem disabled={true} primaryText="Wrap lifetime" />
                                <MenuItem className={styles.ttlList} primaryText="48 Hours" secondaryText="48h" />
                                <MenuItem className={styles.ttlList} primaryText="24 Hours" secondaryText="24h" />
                                <MenuItem className={styles.ttlList} primaryText="12 Hours" secondaryText="12h" />
                                <MenuItem className={styles.ttlList} primaryText="6 Hours" secondaryText="6h" />
                                <MenuItem className={styles.ttlList} primaryText="1 Hour" secondaryText="1h" />
                                <MenuItem className={styles.ttlList} primaryText="30 Minutes" secondaryText="30m" />
                                <MenuItem className={styles.ttlList} primaryText="10 Minutes" secondaryText="10m" />
                                <MenuItem className={styles.ttlList} primaryText="5 Minutes" secondaryText="5m" />
                            </Menu>
                            <Divider/>
                            <TextField
                                style={{marginLeft: 15}}
                                onChange={(e,v) => this.setState({ customTtl: v})}
                                onKeyDown={this.handleCustomTtl}
                                name="custom" 
                                hintText="Custom lifetime" 
                                floatingLabelText="Custom lifetime" 
                            />
                        </Popover>
                    </div>
                }
                <Dialog
                    title="Data has been wrapped"
                    modal={true}
                    open={!_.isEmpty(this.state.wrapInfo)}
                    actions={<FlatButton label="Close" primary={true} onTouchTap={() => { this.props.onModalClose(); this.setState({ wrapInfo: {} }) }} />}
                    onRequestClose={this.props.onModalClose}
                >
                    <div className={sharedStyles.newTokenCodeEmitted}>
                        <TextField
                            fullWidth={true}
                            disabled={true}
                            floatingLabelText="This is a single-use unwrap token to read the wrapped data"
                            defaultValue={tokenValue}
                        />
                        <RaisedButton icon={<ContentContentCopy />} label="Copy to Clipboard" onTouchTap={() => { copy(tokenValue) }} />
                    </div >
                    <div className={sharedStyles.newUrlEmitted}>
                        <TextField
                            fullWidth={true}
                            disabled={true}
                            floatingLabelText="Use this URL if you want to display the wrapped data using Vault UI"
                            defaultValue={urlValue}
                        />
                        <RaisedButton icon={<ContentContentCopy />} label="Copy to Clipboard" onTouchTap={() => { copy(urlValue) }} />
                    </div>
                </Dialog >
            </div>
        )
    }
}