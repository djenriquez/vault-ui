import React, { PropTypes } from 'react';
import _ from 'lodash';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Github from 'mui-icons/fontawesome/github';
import CountDown from './countdown.js'
import styles from './header.css';
import { callVaultApi, history } from '../../shared/VaultUtils.jsx';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import sharedStyles from '../styles.css';
import RaisedButton from 'material-ui/RaisedButton';
import ContentContentCopy from 'material-ui/svg-icons/content/content-copy';
import copy from 'copy-to-clipboard';

var logout = () => {
    window.localStorage.removeItem('vaultAccessToken');
    history.push('/login');
}

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            serverAddr: window.localStorage.getItem('vaultUrl'),
            version: '',
            tokenDialogOpened: false,
            tokenRenewed: false,
            ttl: 0
        }
        _.bindAll(
            this,
            'renewTokenLease'
        );
    }

    static propTypes = {
        tokenIdentity: PropTypes.object
    }

    componentWillMount() {
        callVaultApi('get', 'sys/health', null, null, null)
            .then((resp) => {
                this.setState({
                    version: resp.data.version,
                });
            })
            .catch((error) => {
                if (error.response.status === 429) {
                    this.setState({
                        version: error.response.data.version,
                    });
                } else {
                    snackBarMessage(error);
                }
            });
    }

    renewTokenLease() {
        callVaultApi('post', 'auth/token/renew-self')
            .then((resp) => {
                snackBarMessage("Session renewed");
                this.setState({ ttl: resp.data.auth.lease_duration, tokenRenewed: true });
            })
            .catch(snackBarMessage)
    }


    render() {

        let tokenDialogOptions = [
            <FlatButton label="Close" primary={true} onTouchTap={() => this.setState({ tokenDialogOpened: false })} />
        ];

        let showToken = () => {
            return (
                <Dialog
                    title="Token"
                    modal={true}
                    open={this.state.tokenDialogOpened}
                    actions={tokenDialogOptions}
                >
                    <div className={sharedStyles.newTokenCodeEmitted}>
                        <TextField
                            fullWidth={true}
                            disabled={true}
                            floatingLabelText="Token"
                            defaultValue={window.localStorage.getItem("vaultAccessToken")}
                        />
                        <RaisedButton icon={<ContentContentCopy />} label="Copy to Clipboard" onTouchTap={() => { copy(window.localStorage.getItem("vaultAccessToken")) }} />
                    </div>
                </Dialog>
            )
        }

        let renderTokenInfo = () => {

            let infoSectionItems = []

            let username;
            if (_.has(this.props.tokenIdentity, 'meta.username')) {
                username = this.props.tokenIdentity.meta.username;
            } else {
                username = this.props.tokenIdentity.display_name
            }
            if (username) {
                infoSectionItems.push(
                    <span key="infoUsername" className={styles.infoSectionItem}>
                        <span className={styles.infoSectionItemKey}>logged in as</span>
                        <span className={styles.infoSectionItemValue}>{username}</span>
                    </span>
                )
            }

            infoSectionItems.push(
                <span key="infoServer" className={styles.infoSectionItem}>
                    <span className={styles.infoSectionItemKey}>connected to</span>
                    <span className={styles.infoSectionItemValue}>{this.state.serverAddr}</span>
                </span>
            )

            if (this.state.tokenRenewed) {
                infoSectionItems.push(
                        <span key="infoSessionTimeout" className={styles.infoSectionItem}>
                            <span className={styles.infoSectionItemKey}>token ttl</span>
                            <span className={styles.infoSectionItemValue}>
                                <CountDown countDown={this.state.ttl} retrigger={this.props.tokenIdentity.last_renewal_time} />
                            </span>
                        </span>
                    );
            } else if (this.props.tokenIdentity.ttl) {
                infoSectionItems.push(
                    <span key="infoSessionTimeout" className={styles.infoSectionItem}>
                        <span className={styles.infoSectionItemKey}>token ttl</span>
                        <span className={styles.infoSectionItemValue}>
                            <CountDown countDown={this.props.tokenIdentity.ttl} retrigger={this.props.tokenIdentity.last_renewal_time} />
                        </span>
                    </span>
                )
            }

            if (this.state.version) {
                infoSectionItems.push(
                    <span key="infoVersion" className={styles.infoSectionItem}>
                        <span className={styles.infoSectionItemKey}>vault version</span>
                        <span className={styles.infoSectionItemValue}>{this.state.version}</span>
                    </span>
                )
            }

            return infoSectionItems;
        }

        return (
            <div>
                {showToken()}
                <div id={styles.headerWrapper}>
                    <Toolbar style={{ backgroundColor: '#000000', height: '64px' }}>
                        <ToolbarGroup firstChild={true}>
                            <IconButton
                                onTouchTap={() => {
                                    if (WEBPACK_DEF_TARGET_WEB) {
                                        window.open('https://github.com/djenriquez/vault-ui', '_blank');
                                    } else {
                                        event.preventDefault();
                                        require('electron').shell.openExternal('https://github.com/djenriquez/vault-ui')
                                    }
                                }}
                            >
                                <Github className={styles.title} />
                            </IconButton>
                            <ToolbarTitle className={styles.title}
                                onTouchTap={() => {
                                    history.push('/');
                                }}
                                text="VAULT - UI" />
                        </ToolbarGroup>
                        <ToolbarGroup>
                            {renderTokenInfo()}
                        </ToolbarGroup>
                        <ToolbarGroup lastChild={true}>
                            <IconMenu iconButtonElement={<IconButton ><NavigationMenu color='white' /></IconButton>}>
                                <MenuItem
                                    primaryText="Show token"
                                    onTouchTap={() => this.setState({ tokenDialogOpened: true })}
                                />
                                <Divider />
                                <MenuItem
                                    primaryText="Renew token lease"
                                    onTouchTap={this.renewTokenLease}
                                />
                                <Divider />
                                <MenuItem
                                    primaryText="Logout"
                                    onTouchTap={logout}
                                />
                            </IconMenu>
                        </ToolbarGroup>
                    </Toolbar>
                </div>
            </div>
        )
    }
}

export default Header;
