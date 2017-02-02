import React from 'react';
import Menu from '../shared/Menu/Menu.jsx';
import Header from '../shared/Header/Header.jsx';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Paper from 'material-ui/Paper';
import { browserHistory } from 'react-router';
import { green500, red500, yellow500 } from 'material-ui/styles/colors.js'
import styles from './app.css';

let twoMinuteWarningTimeout;
let logoutTimeout;

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.renderLogoutDialog = this.renderLogoutDialog.bind(this);
        this.state = {
            snackbarMessage: '',
            snackbarType: 'OK',
            snackbarStyle: {},
            namespace: '/',
            logoutOpen: false,
            logoutPromptSeen: false
        }
    }

    componentDidMount() {
        if (!window.localStorage.getItem('showDeleteModal')) {
            window.localStorage.setItem('showDeleteModal', 'true');
        }
        if (!window.localStorage.getItem('enableCapabilitiesCache')) {
            window.localStorage.setItem('enableCapabilitiesCache', 'true');
        }
        document.addEventListener("snackbar", (e) => {
            let messageStyle = { backgroundColor: green500 };
            if ( e.detail.message instanceof Error ) {
                messageStyle = { backgroundColor: red500 };
            }

            this.setState({
                snackbarMessage: e.detail.message.toString(),
                snackbarType: e.detail.type || 'OK',
                snackbarStyle: messageStyle
            });
        });

        let tokenExpireDate = window.localStorage.getItem('vaultAccessTokenExpiration');
        let TWO_MINUTES = 1000 * 60 * 2;

        let twoMinuteWarningTimeout = () => {
            if (!this.state.logoutPromptSeen) {
                this.setState({
                    logoutOpen: true
                });
            }
        }

        let logoutTimeout = () => {
            browserHistory.push('/login');
        }
        // The upper limit of setTimeout is 0x7FFFFFFF (or 2147483647 in decimal)
        if (tokenExpireDate >= 0 && tokenExpireDate < 2147483648) {
            setTimeout(logoutTimeout, tokenExpireDate);
            setTimeout(twoMinuteWarningTimeout, tokenExpireDate - TWO_MINUTES);
        }
    }

    componentWillUnmount() {
        clearTimeout(logoutTimeout);
        clearTimeout(twoMinuteWarningTimeout);
    }

    renderLogoutDialog() {
        const actions = [
            <FlatButton label="OK" primary={true} onTouchTap={() => this.setState({ logoutOpen: false, logoutPromptSeen: true })} />
        ];

        return (
            <Dialog
                title={`Logout`}
                modal={true}
                actions={actions}
                open={this.state.logoutOpen}
                onRequestClose={() => this.setState({ logoutOpen: false, logoutPromptSeen: true })}
                >
                <div className={styles.error}>Your token will expire in 2 minutes.  You will want to finish up what you are working on!</div>
            </Dialog>
        );
    }

    render() {
        let welcome = (
            <div>
                <h1 id={styles.welcomeHeadline}>Welcome to Vault UI.</h1>
                <p>From here you can manage your secrets, check the health of your Vault clusters, and more.
                Use the menu on the left to navigate around.</p>
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
                {this.state.logoutOpen && this.renderLogoutDialog()}
            <Header />
            <Menu pathname={this.props.location.pathname} />
            <div id={styles.content}>
                <Paper zDepth={5}>
                    {this.props.children || welcome}
                </Paper>
            </div>

        </div>;
    }
}
