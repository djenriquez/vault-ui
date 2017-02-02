import React, {PropTypes} from 'react';
import styles from './menu.css';
import Drawer from 'material-ui/Drawer';
import { browserHistory } from 'react-router';
import { List, ListItem, makeSelectable } from 'material-ui/List';
import {tokenHasCapabilities, callVaultApi} from '../VaultUtils.jsx'

const SelectableList = makeSelectable(List);


const supported_secret_backend_types = [
    'generic'
]

const supported_auth_backend_types = [
    'token',
    'github'
]

class Menu extends React.Component {
    static propTypes = {
        pathname: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);
    }

    state = {
        authBackends: [
            {
                path: 'token/',
                type: 'token',
                description: 'token based credentials'
            }
        ],
        secretBackends: [
            {
                path: 'secret/',
                type: 'generic',
                description: 'generic secret storage'
            }
        ]
    };

    componentDidMount() {
        tokenHasCapabilities(['read'], 'sys/mounts')
            .then(() => {
                return callVaultApi('get', 'sys/mounts').then((resp) => {
                    let entries = _.get(resp, 'data.data', _.get(resp, 'data', {}));
                    let discoveredSecretBackends = _.map(entries, (v, k) => {
                        if ( _.indexOf(supported_secret_backend_types, v.type) != -1 ) {
                            let entry = {
                                path: k,
                                type: v.type,
                                description: v.description
                            }
                            return entry;
                        }
                    }).filter(Boolean);
                    this.setState({secretBackends: discoveredSecretBackends});
                });
            })
            .catch((err) => {
                // Not allowed to list secret backends, using default
                console.log("unable to list: " + err);
            })


        tokenHasCapabilities(['read'], 'sys/auth/')
            .then(() => {
                return callVaultApi('get', 'sys/auth').then((resp) => {
                    let entries = _.get(resp, 'data.data', _.get(resp, 'data', {}));
                    let discoveredAuthBackends = _.map(entries, (v, k) => {
                        if ( _.indexOf(supported_auth_backend_types, v.type) != -1 ) {
                            let entry = {
                                path: k,
                                type: v.type,
                                description: v.description
                            }
                            return entry;
                        }
                    }).filter(Boolean);
                    this.setState({authBackends: discoveredAuthBackends});
                });
            })
            .catch((err) => {
                // Not allowed to list secret backends, using default
                console.log("unable to list: " + err);
            })
    }


    render() {

        let renderSecretBackendList = () => {
            return _.map(this.state.secretBackends, (backend, idx) => {
                return (
                    <ListItem primaryText={backend.path} secondaryText={backend.type} value={`/secrets/${backend.type}/${backend.path}`} />
                )
            })
        }

        let renderAuthBackendList = () => {
            return _.map(this.state.authBackends, (backend, idx) => {
                return (
                    <ListItem primaryText={backend.path} secondaryText={backend.type} value={`/auth/${backend.type}/${backend.path}`} />
                )
            })
        }


        return (
            <Drawer containerClassName={styles.root} docked={true} open={true} >
                <SelectableList value={this.props.pathname} onChange={(e,v) => browserHistory.push(v)}>
                    <ListItem
                        primaryText="Secret Backends"
                        primaryTogglesNestedList={true}
                        initiallyOpen={true}
                        nestedItems={renderSecretBackendList()}
                    />
                    <ListItem
                        primaryText="Auth Backends"
                        primaryTogglesNestedList={true}
                        initiallyOpen={true}
                        nestedItems={renderAuthBackendList()}
                    />
                    <ListItem
                        primaryText="System"
                        primaryTogglesNestedList={true}
                        initiallyOpen={true}
                        nestedItems={[
                            <ListItem primaryText="Policies" secondaryText="Manage Vault Access Policies" value="/policies/manage" />,
                            <ListItem primaryText="Response Wrapper" secondaryText="Securely forward secrets" value="/responsewrapper" />
                        ]}
                    />
                    <ListItem
                        primaryText="Preferencies"
                        secondaryText="Customise Vault-UI"
                        primaryTogglesNestedList={false}
                        value="/settings"
                    />

                </SelectableList>
            </Drawer>

        );
    }
}

export default Menu;
