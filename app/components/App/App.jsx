import React, { PropTypes } from 'react';
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import Menu from '../shared/Menu/Menu.jsx';
import Header from '../shared/Header/Header.jsx';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Paper from 'material-ui/Paper';
import Warning from 'material-ui/svg-icons/alert/warning';
import { green500, red500 } from 'material-ui/styles/colors.js'
import styles from './app.css';
import JsonEditor from '../shared/JsonEditor.jsx';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import { callVaultApi, tokenHasCapabilities, history } from '../shared/VaultUtils.jsx'

let twoMinuteWarningTimeoutId;
let logoutTimeoutId;

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class App extends React.Component {
    static propTypes = {
        location: PropTypes.object.isRequired,
        children: PropTypes.node
    }

    constructor(props) {
        super(props);

        this.state = {
            snackbarMessage: '',
            snackbarType: 'OK',
            snackbarStyle: {},
            logoutOpen: false,
            logoutPromptSeen: false,
            identity: {},
            tokenCanQueryCapabilities: true,
            tokenCanListSecretBackends: true,
            tokenCanListAuthBackends: true,
        }

        _.bindAll(
            this,
            'reloadSessionIdentity',
            'componentDidMount',
            'componentWillUnmount',
            'renderSessionExpDialog',
            'renderWarningSecretBackends',
            'renderWarningAuthBackends'
        );
    }

    reloadSessionIdentity() {
        let TWO_MINUTES = 1000 * 60 * 2;

        let twoMinuteWarningTimeout = () => {
            if (!this.state.logoutPromptSeen) {
                this.setState({
                    logoutOpen: true
                });
            }
        }

        let logoutTimeout = () => {
            history.push('/login');
        }

        // Retrieve session identity information
        callVaultApi('get', 'auth/token/lookup-self')
            .then((resp) => {
                if (_.has(resp, 'data.data')) {
                    this.setState({ identity: resp.data.data })
                    let ttl = resp.data.data.ttl * 1000;
                    // The upper limit of setTimeout is 0x7FFFFFFF (or 2147483647 in decimal)
                    if (ttl > 0 && ttl < 2147483648) {
                        clearTimeout(logoutTimeoutId);
                        clearTimeout(twoMinuteWarningTimeoutId);
                        logoutTimeoutId = setTimeout(logoutTimeout, ttl);
                        twoMinuteWarningTimeoutId = setTimeout(twoMinuteWarningTimeout, ttl - TWO_MINUTES);
                    }
                }
            })
            .catch((err) => {
                if (_.has(err, 'response.status') && err.response.status >= 400) {
                    window.localStorage.removeItem('vaultAccessToken');
                    history.push(`/login?returnto=${encodeURI(this.props.location.pathname)}`);
                } else throw err;
            });
    }

    componentDidMount() {
        if (!window.localStorage.getItem('showDeleteModal')) {
            window.localStorage.setItem('showDeleteModal', 'true');
        }
        if (!window.localStorage.getItem('enableCapabilitiesCache')) {
            window.localStorage.setItem('enableCapabilitiesCache', 'true');
        }
        if (!window.localStorage.getItem('enableDiffAnnotations')) {
            window.localStorage.setItem('enableDiffAnnotations', 'false');
        }
        document.addEventListener("snackbar", (e) => {
            let messageStyle = { backgroundColor: green500 };
            let message = e.detail.message.toString();
            if (e.detail.message instanceof Error) {
                // Handle logical erros from vault
                if (_.has(e.detail.message, 'response.data.errors'))
                    if (e.detail.message.response.data.errors.length > 0)
                        message = e.detail.message.response.data.errors.join(',');
                messageStyle = { backgroundColor: red500 };
            }

            this.setState({
                snackbarMessage: message,
                snackbarType: e.detail.type || 'OK',
                snackbarStyle: messageStyle
            });
        });

        this.reloadSessionIdentity();

        // Check access to the sys/capabilities-self path
        callVaultApi('post', 'sys/capabilities-self', null, { path: '/' })
            .then(() => {
                this.setState({ tokenCanQueryCapabilities: true });
            })
            .catch(() => {
                this.setState({ tokenCanQueryCapabilities: false });
            })

        // Check capabilities to list backends
        tokenHasCapabilities(['read'], 'sys/mounts').catch(() => {
            this.setState({ tokenCanListSecretBackends: false });
        });
        tokenHasCapabilities(['read'], 'sys/auth').catch(() => {
            this.setState({ tokenCanListAuthBackends: false });
        });

    }

    componentWillUnmount() {
        clearTimeout(logoutTimeoutId);
        clearTimeout(twoMinuteWarningTimeoutId);
    }

    renderSessionExpDialog() {
        const actions = [
            <FlatButton
                label="RENEW"
                primary={true}
                onTouchTap={() => {
                    callVaultApi('post', 'auth/token/renew-self')
                        .then(() => {
                            this.reloadSessionIdentity();
                            snackBarMessage("Session renewed");
                        })
                        .catch(snackBarMessage)
                    this.setState({ logoutOpen: false })
                }}
            />,
            <FlatButton label="DISMISS" primary={false} onTouchTap={() => this.setState({ logoutOpen: false, logoutPromptSeen: true })} />
        ];

        return (
            <Dialog
                title="Your session is about to expire!"
                modal={true}
                actions={actions}
                open={this.state.logoutOpen}
                onRequestClose={() => this.setState({ logoutOpen: false, logoutPromptSeen: true })}
            >
                <div className={styles.error}>Your session token will expire soon. Use the renew button to request a lease extension</div>
            </Dialog>
        );
    }

    renderWarningCapabilities() {
        return (
            <Paper className={styles.warningMsg} zDepth={0}>
                <Card initiallyExpanded={false}>
                    <CardHeader
                        title="Your token doesn't have permissions to query for capabilities"
                        subtitle="Vault UI needs some permissions granted to your token. Tap on this message for more information"
                        avatar={<Warning style={{ color: '#ffab00' }} />}
                        actAsExpander={true}
                        showExpandableButton={true}
                    />
                    <CardText expandable={true}>
                        Your token has been assigned the following policies:
                        <ul>
                            {_.map(this.state.identity.policies, (pol, idx) => {
                                return (<li key={idx}>{pol}</li>)
                            })}
                        </ul>
                        and none of them contains the following permissions:
                        <JsonEditor mode="text" modes={["text"]} value={{ path: { "sys/capabilities-self": { capabilities: ["update"] } } }} />
                    </CardText>
                </Card>
            </Paper>
        )
    }

    renderWarningAuthBackends() {
        return (
            <Paper className={styles.warningMsg} zDepth={0}>
                <Card initiallyExpanded={false}>
                    <CardHeader
                        title="Your token doesn't have permissions to list authentication backends"
                        subtitle="Vault UI needs some permissions granted to your token. Tap on this message for more information"
                        avatar={<Warning style={{ color: '#ffab00' }} />}
                        actAsExpander={true}
                        showExpandableButton={true}
                    />
                    <CardText expandable={true}>
                        Your token has been assigned the following policies:
                        <ul>
                            {_.map(this.state.identity.policies, (pol, idx) => {
                                return (<li key={idx}>{pol}</li>)
                            })}
                        </ul>
                        and none of them contains the following permissions:
                        <JsonEditor mode="text" modes={["text"]} value={{ path: { "sys/auth": { capabilities: ["read"] } } }} />
                    </CardText>
                </Card>
            </Paper>
        )
    }

    renderWarningSecretBackends() {
        return (
            <Paper className={styles.warningMsg} zDepth={0}>
                <Card initiallyExpanded={false}>
                    <CardHeader
                        title="Your token doesn't have permissions to list secret backends"
                        subtitle="Vault UI needs some permissions granted to your token. Tap on this message for more information"
                        avatar={<Warning style={{ color: '#ffab00' }} />}
                        actAsExpander={true}
                        showExpandableButton={true}
                    />
                    <CardText expandable={true}>
                        Your token has been assigned the following policies:
                        <ul>
                            {_.map(this.state.identity.policies, (pol, idx) => {
                                return (<li key={idx}>{pol}</li>)
                            })}
                        </ul>
                        and none of them contains the following permissions:
                        <JsonEditor mode="text" modes={["text"]} value={{ path: { "sys/mounts": { capabilities: ["read"] } } }} />
                    </CardText>
                </Card>
            </Paper>
        )
    }

    render() {
        let welcome = (
            <div>
                <Tabs>
                    <Tab className={styles.welcomeTab} label="WELCOME TO VAULT-UI" >
                        <Paper className={styles.welcomeScreen} zDepth={0}>
                            <Paper className={styles.welcomeHeader} zDepth={0}>
                                <h2>Get started by using the left menu to navigate your Vault</h2>
                            </Paper>
                            {!this.state.tokenCanQueryCapabilities ? this.renderWarningCapabilities() : null}
                            {!this.state.tokenCanListSecretBackends ? this.renderWarningSecretBackends() : null}
                            {!this.state.tokenCanListAuthBackends ? this.renderWarningAuthBackends() : null}
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
        return <div>
            <Snackbar
                className={styles.snackbar}
                bodyStyle={this.state.snackbarStyle}
                open={this.state.snackbarMessage != ''}
                message={this.state.snackbarMessage}
                autoHideDuration={3000}
                onRequestClose={() => this.setState({ snackbarMessage: '' })}
                onActionTouchTap={() => this.setState({ snackbarMessage: '' })}
            />
            {this.state.logoutOpen && this.renderSessionExpDialog()}
            <Header tokenIdentity={this.state.identity} />
            <Menu pathname={this.props.location.pathname} />
            <div id={styles.content}>
                <Paper zDepth={1}>
                    {this.props.children || welcome}
                </Paper>
            </div>
        </div>
    }
}
