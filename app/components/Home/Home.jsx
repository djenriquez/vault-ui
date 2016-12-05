import React, { PropTypes } from 'react'
import Snackbar from 'material-ui/Snackbar';
import { green500, red500, yellow500 } from 'material-ui/styles/colors.js'
import axios from 'axios';

import Header from '../shared/Header/Header.jsx';
import Menu from '../shared/Menu/Menu.jsx';
import Secrets from '../Secrets/Secrets.jsx';
import Health from '../Health/Health.jsx';
import Policies from '../Policies/Home.jsx';
import Settings from '../Settings/Settings.jsx';
import ResponseWrapper from '../ResponseWrapper/ResponseWrapper.jsx';

import styles from './home.css';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { browserHistory } from 'react-router';

var logoutCheck;

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.renderContent = this.renderContent.bind(this);
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

    componentWillUnmount() {
        clearInterval(logoutCheck)
    }

    componentDidMount() {
        if (!window.localStorage.getItem('showDeleteModal')) {
            window.localStorage.setItem('showDeleteModal', 'true');
        }
        document.addEventListener("snackbar", (e) => {
            this.setState({
                snackbarMessage: e.detail.message,
                snackbarType: e.detail.type || 'OK',
                snackbarOpen: true
            });
        });

        logoutCheck = window.setInterval(() => {
            let tokenExpireDate = window.localStorage.getItem('vaultAccessTokenExpiration');
            let TWO_MINUTES = 1000 * 60 * 2;
            if (tokenExpireDate - TWO_MINUTES < Date.now()) {
                if (!this.state.logoutPromptSeen) {
                    this.setState({
                        logoutOpen: true
                    });
                }
            }
            if (tokenExpireDate < Date.now()) {
                browserHistory.push('/login');
            }
        },1000*5);
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
                <div className={styles.error}>Your token will expire in 2 minutes.  You'll want to finish up what you are working on!</div>
            </Dialog>
        );
    }

    renderContent() {
        switch (this.props.location.pathname) {
            case '/secrets':
                return <Secrets />
            case '/health':
                return <Health />
            case '/settings':
                return <Settings />
            case '/responsewrapper':
                return <ResponseWrapper />
            case '/policies/manage':
            case '/policies/github':
            case '/policies/ec2':
                let subPath = _.last(this.props.location.pathname.split('/'));
                return <Policies subPath={subPath}/>
            default:
                return (
                    <div>
                        <h1 id={styles.welcomeHeadline}>Welcome to Vault UI.</h1>
                        <p>From here you can manage your secrets, check the health of your Vault clusters, and more.
                        Use the menu on the left to navigate around.</p>
                    </div>
                );
        }
    }

    render() {
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
                {this.renderContent()}
            </div>

        </div>;
    }
}
