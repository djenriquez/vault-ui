import React from 'react';
import Menu from '../shared/Menu/Menu.jsx';
import Header from '../shared/Header/Header.jsx';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
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
            snackbarOpen: false,
            snackbarType: 'OK',
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
            this.setState({
                snackbarMessage: e.detail.message,
                snackbarType: e.detail.type || 'OK',
                snackbarOpen: true
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
        let messageStyle = { backgroundColor: green500 };
        if (this.state.snackbarType == 'warn') {
            messageStyle = { backgroundColor: yellow500 };
        }
        if (this.state.snackbarType == 'error') {
            messageStyle = { backgroundColor: red500 };
        }
        return <div>
            <Snackbar
                className={styles.snackbar}
                bodyStyle={messageStyle}
                open={this.state.snackbarOpen}
                message={this.state.snackbarMessage}
                autoHideDuration={2000}
                onRequestClose={() => this.setState({ snackbarOpen: false })}
                />
                {this.state.logoutOpen && this.renderLogoutDialog()}
            <Header />
            <Menu pathname={this.props.location.pathname} />
            <div id={styles.content}>
                {this.props.children || welcome}
            </div>

        </div>;
    }
}
