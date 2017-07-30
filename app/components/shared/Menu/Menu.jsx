import React, { PropTypes } from 'react';
import _ from 'lodash';
import styles from './menu.css';
import Drawer from 'material-ui/Drawer';
import { List, ListItem, makeSelectable } from 'material-ui/List';
import IconButton from 'material-ui/IconButton';
import Build from 'material-ui/svg-icons/action/build';
import ContentAdd from 'material-ui/svg-icons/content/add'
import MountTuneDeleteDialog from '../MountUtils/MountTuneDelete.jsx'
import NewMountDialog from '../MountUtils/NewMount.jsx'
import { tokenHasCapabilities, callVaultApi, history } from '../VaultUtils.jsx'

const SelectableList = makeSelectable(List);

const supported_secret_backend_types = [
    'generic'
]

const supported_auth_backend_types = [
    'token',
    'github',
    'radius',
    'aws-ec2',
    'userpass',
    'aws',
    'okta'
]

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

class Menu extends React.Component {
    static propTypes = {
        pathname: PropTypes.string.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            tuneMountObj: null,
            openNewAuthMountDialog: false,
            openNewSecretMountDialog: false,
            selectedPath: this.props.pathname,
            authBackends: [],
            secretBackends: []
        };
    }

    getCurrentMenuItemFromPath(path) {
        if (path.startsWith('/secret')) {
            let res = _.find(this.state.secretBackends, (backend) => {
                return path.startsWith(`/secrets/${backend.type}/${backend.path}`)
            });
            if (res) {
                return `/secrets/${res.type}/${res.path}`;
            }
        }
        else if (path.startsWith('/auth')) {
            let res = _.find(this.state.authBackends, (backend) => {
                return path.startsWith(`/auth/${backend.type}/${backend.path}`)
            });
            if (res) {
                return `/auth/${res.type}/${res.path}`;
            }
        } else {
            return path;
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.pathname != nextProps.pathname) {
            this.setState({ selectedPath: this.getCurrentMenuItemFromPath(nextProps.pathname) });
        }
    }


    loadSecretBackends() {
        tokenHasCapabilities(['read'], 'sys/mounts')
            .then(() => {
                return callVaultApi('get', 'sys/mounts').then((resp) => {
                    let entries = _.get(resp, 'data.data', _.get(resp, 'data', {}));
                    let discoveredSecretBackends = _.map(entries, (v, k) => {
                        if (_.indexOf(supported_secret_backend_types, v.type) != -1) {
                            let entry = {
                                path: k,
                                type: v.type,
                                description: v.description,
                                config: v.config
                            }
                            return entry;
                        }
                    }).filter(Boolean);
                    this.setState({ secretBackends: discoveredSecretBackends }, () => this.getCurrentMenuItemFromPath(this.props.pathname));
                }).catch(snackBarMessage)
            }).catch(() => { snackBarMessage(new Error("No permissions to list secret backends")) })
    }

    loadAuthBackends() {
        tokenHasCapabilities(['read'], 'sys/auth')
            .then(() => {
                return callVaultApi('get', 'sys/auth').then((resp) => {
                    let entries = _.get(resp, 'data.data', _.get(resp, 'data', {}));
                    let discoveredAuthBackends = _.map(entries, (v, k) => {
                        if (_.indexOf(supported_auth_backend_types, v.type) != -1) {
                            let entry = {
                                path: k,
                                type: v.type,
                                description: v.description,
                                config: v.config
                            }
                            return entry;
                        }
                    }).filter(Boolean);
                    this.setState({ authBackends: discoveredAuthBackends }, () => this.getCurrentMenuItemFromPath(this.props.pathname));
                }).catch(snackBarMessage)
            }).catch(() => { snackBarMessage(new Error("No permissions to list auth backends")) })
    }

    componentDidMount() {
        this.loadAuthBackends();
        this.loadSecretBackends();
    }

    render() {
        let renderSecretBackendList = () => {
            return _.map(this.state.secretBackends, (backend, idx) => {
                let tuneObj = {
                    path: `sys/mounts/${backend.path}`,
                    config: backend.config
                }

                return (
                    <ListItem
                        key={idx}
                        primaryText={backend.path}
                        secondaryText={`type: ${backend.type}`}
                        value={`/secrets/${backend.type}/${backend.path}`}
                        rightIconButton={
                            <IconButton
                                style={{ opacity: 0.1 }}
                                hoveredStyle={{ opacity: 1.0 }}
                                onTouchTap={() => this.setState({ tuneMountObj: tuneObj })}
                            >
                                <Build />
                            </IconButton>
                        }
                    />
                )
            })
        }

        let renderAuthBackendList = () => {
            return _.map(this.state.authBackends, (backend, idx) => {
                let tuneObj = {
                    path: `sys/auth/${backend.path}`,
                    uipath: `/auth/${backend.type}/${backend.path}`,
                    config: backend.config
                }

                return (
                    <ListItem
                        key={idx}
                        primaryText={backend.path}
                        secondaryText={`type: ${backend.type}`}
                        value={`/auth/${backend.type}/${backend.path}`}
                        rightIconButton={
                            <IconButton
                                style={{ opacity: 0.1 }}
                                hoveredStyle={{ opacity: 1.0 }}
                                onTouchTap={() => this.setState({ tuneMountObj: tuneObj })}
                            >
                                <Build />
                            </IconButton>
                        }
                    />
                )
            })
        }

        let handleMenuChange = (e, v) => {
            history.push(v)
        }

        return (
            <div>
                <NewMountDialog
                    mountType="auth"
                    supportedBackendTypes={supported_auth_backend_types}
                    openDialog={this.state.openNewAuthMountDialog}
                    onActionSuccess={(type, path) => {
                        snackBarMessage(`New authentication backend ${type} mounted at ${path}`)
                        this.loadAuthBackends();
                    }}
                    onActionError={snackBarMessage}
                    onClose={() => this.setState({ openNewAuthMountDialog: false })}
                />
                <NewMountDialog
                    mountType="secret"
                    supportedBackendTypes={supported_secret_backend_types}
                    openDialog={this.state.openNewSecretMountDialog}
                    onActionSuccess={(type, path) => {
                        snackBarMessage(`New secret backend ${type} mounted at ${path}`)
                        this.loadSecretBackends();
                    }}
                    onActionError={snackBarMessage}
                    onClose={() => this.setState({ openNewSecretMountDialog: false })}
                />
                <MountTuneDeleteDialog
                    mountpointObject={this.state.tuneMountObj}
                    onActionError={snackBarMessage}
                    onActionTuneSuccess={(path) => {
                        snackBarMessage(`Mountpoint ${path} tuned`)
                        this.loadAuthBackends();
                        this.loadSecretBackends();
                    }}
                    onActionDeleteSuccess={(path, uipath) => {
                        snackBarMessage(`Mountpoint ${path} deleted`)
                        if (this.props.pathname.startsWith(uipath)) {
                            history.push('/');
                        }
                        this.loadAuthBackends();
                        this.loadSecretBackends();
                    }}
                    onClose={() => this.setState({ tuneMountObj: null })}
                />
                <Drawer containerClassName={styles.root} docked={true} open={true} >
                    <SelectableList value={this.state.selectedPath} onChange={handleMenuChange}>
                        <ListItem
                            primaryText="Secret Backends"
                            primaryTogglesNestedList={true}
                            initiallyOpen={true}
                            nestedItems={renderSecretBackendList()}
                            rightIconButton={
                                <IconButton
                                    style={{ opacity: 0.1 }}
                                    hoveredStyle={{ opacity: 1.0 }}
                                    onTouchTap={() => this.setState({openNewSecretMountDialog: true})}
                                >
                                    <ContentAdd />
                                </IconButton>
                            }
                        />
                        <ListItem
                            primaryText="Auth Backends"
                            primaryTogglesNestedList={true}
                            initiallyOpen={true}
                            nestedItems={renderAuthBackendList()}
                            rightIconButton={
                                <IconButton
                                    style={{ opacity: 0.1 }}
                                    hoveredStyle={{ opacity: 1.0 }}
                                    onTouchTap={() => this.setState({openNewAuthMountDialog: true})}
                                >
                                    <ContentAdd />
                                </IconButton>
                            }

                        />
                        <ListItem
                            primaryText="System"
                            primaryTogglesNestedList={true}
                            initiallyOpen={true}
                            nestedItems={[
                                <ListItem primaryText="Policies" secondaryText="Manage Vault Access Policies" value="/sys/policies" />,
                                <ListItem primaryText="Data Wrapper" secondaryText="Securely Forward JSON Data" value="/responsewrapper" />
                            ]}
                        />
                        <ListItem
                            primaryText="Preferences"
                            secondaryText="Customize Vault-UI"
                            primaryTogglesNestedList={false}
                            value="/settings"
                        />

                    </SelectableList>
                </Drawer>
            </div>
        )
    }
}

export default Menu;
