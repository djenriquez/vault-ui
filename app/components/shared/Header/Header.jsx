import React, { PropTypes } from 'react';
import _ from 'lodash';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import { browserHistory } from 'react-router';
import CountDown from './countdown.js'
import styles from './header.css';
import { callVaultApi } from '../../shared/VaultUtils.jsx'

var logout = () => {
    window.localStorage.removeItem('vaultAccessToken');
    browserHistory.push('/login');
}

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            serverAddr: window.localStorage.getItem('vaultUrl'),
            version: ''
        }
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
                    throw error;
                }
            });
    }

    render() {

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

            if (this.props.tokenIdentity.ttl) {
                infoSectionItems.push(
                    <span key="infoSessionTimeout" className={styles.infoSectionItem}>
                        <span className={styles.infoSectionItemKey}>token ttl</span>
                        <span className={styles.infoSectionItemValue}>
                            <CountDown startTime={this.props.tokenIdentity.ttl} />
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
            <div id={styles.headerWrapper}>
                <Toolbar style={{ backgroundColor: '#000000', height: '64px' }}>
                    <ToolbarGroup firstChild={true}>
                        <IconButton href={'https://github.com/djenriquez/vault-ui'}>
                            <FontIcon className={`fa fa-github ${styles.title}`} />
                        </IconButton>
                        <ToolbarTitle className={styles.title}
                            onTouchTap={() => {
                                browserHistory.push('/');
                            }}
                            text="VAULT-UI" />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        {renderTokenInfo()}
                    </ToolbarGroup>
                    <ToolbarGroup lastChild={true}>
                        <FlatButton className={styles.title} onTouchTap={logout} label="Logout" />
                    </ToolbarGroup>
                </Toolbar>
            </div>
        )
    }
}

export default Header;
