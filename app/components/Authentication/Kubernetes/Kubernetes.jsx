import React from 'react';
import PropTypes from 'prop-types';
// Material UI
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import { List } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
// Styles
import styles from './kubernetes.css';
import sharedStyles from '../../shared/styles.css';
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx';
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import ItemPicker from '../../shared/ItemPicker/ItemPicker.jsx'
import ItemList from '../../shared/ItemList/ItemList.jsx';

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class KubernetesAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    kubernetesConfigSchema = {
        token_reviewer_jwt: undefined,
        kubernetes_host: undefined,
        kubernetes_ca_cert: undefined,
        pem_keys: undefined
    };

    roleConfigSchema = {
        bound_service_account_names: undefined,
        bound_service_account_namespaces: undefined,
        ttl: undefined,
        max_ttl: undefined,
        period: undefined,
        policies: []
    };

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/kubernetes/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            kubernetesRoles: [],
            configObj: this.kubernetesConfigSchema,
            newConfigObj: this.kubernetesConfigSchema,
            newRoleConfig: this.roleConfigSchema,
            selectedRoleId: '',
            newRoleId: '',
            newSecretBtnDisabled: false,
            openNewRoleDialog: false,
            openEditRoleDialog: false,
            selectedTab: 'roles',
            isBackendConfigured: false
        };

        _.bindAll(
            this,
            'listKubernetesRoles',
            'getKubernetesAuthConfig',
            'createUpdateConfig',
            'createUpdateRole'
        );
    }

    listKubernetesRoles() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/role`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role`, { list: true }, null)
                    .then((resp) => {
                        let roles = _.get(resp, 'data.data.keys', []);
                        this.setState({ kubernetesRoles: _.valuesIn(roles) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ kubernetesRoles: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    getKubernetesAuthConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/config`, null, null)
                    .then((resp) => {
                        let config = _.get(resp, 'data.data', this.kubernetesConfigSchema);
                        this.setState({
                            configObj: config,
                            newConfigObj: config,
                            isBackendConfigured: true
                        });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            error.message = `This backend has not yet been configured`;
                            history.push(`${this.state.baseUrl}backend`);
                            this.setState({ selectedTab: 'backend', isBackendConfigured: false });
                            snackBarMessage(error);
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            });
    }

    createUpdateConfig() {
        tokenHasCapabilities(['update'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('post', `${this.state.baseVaultPath}/config`, null, this.state.newConfigObj)
                    .then(() => {
                        snackBarMessage(`Backend ${this.state.baseVaultPath}/config has been updated`);
                        this.setState({ isBackendConfigured: true, configObj: this.state.newConfigObj });
                    })
                    .catch(snackBarMessage);
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            });
    }

    createUpdateRole(roleId) {
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/role/${roleId}`)
            .then(() => {
                let updateObj = _.clone(this.state.newRoleConfig);
                updateObj.policies = updateObj.policies.join(',');
                callVaultApi('post', `${this.state.baseVaultPath}/role/${roleId}`, null, updateObj)
                    .then(() => {
                        snackBarMessage(`Role ${roleId} has been updated`);
                        this.listKubernetesRoles();
                        this.setState({ openNewRoleDialog: false, openEditRoleDialog: false, newRoleConfig: _.clone(this.roleConfigSchema), selectedRoleId: '', newRoleId: '' });
                        history.push(`${this.state.baseUrl}roles/`);
                    })
                    .catch(snackBarMessage);
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to display properties for role ${this.state.selectedRoleId}`));
            });
    }

    displayRole() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${this.state.selectedRoleId}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role/${this.state.selectedRoleId}`, null, null, null)
                    .then((resp) => {
                        let roleConfig = _.get(resp, 'data.data', {});
                        roleConfig.role = this.state.selectedRoleId;
                        this.setState({ newRoleConfig: roleConfig, openEditRoleDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to display properties for role ${this.state.selectedRoleId}`));
            })
    }

    componentWillMount() {
        let tab = this.props.location.pathname.split(this.state.baseUrl)[1];
        if (!tab) {
            history.push(`${this.state.baseUrl}${this.state.selectedTab}/`);
        } else {
            this.setState({ selectedTab: tab.includes('/') ? tab.split('/')[0] : tab });
        }
    }

    componentDidMount() {
        this.listKubernetesRoles();
        this.getKubernetesAuthConfig();
        let uri = this.props.location.pathname.split(this.state.baseUrl)[1];
        if (uri.includes('roles/') && uri.split('roles/')[1]) {
            this.setState({ selectedRoleId: uri.split('roles/')[1] });
            this.displayRole();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedRoleId != prevState.selectedRoleId) {
            this.listKubernetesRoles();
            if (this.state.selectedRoleId) {
                this.displayRole();
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/kubernetes/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                kubernetesRoles: [],
                selectedRoleId: '',
                newConfigObj: this.kubernetesConfigSchema,
                configObj: this.kubernetesConfigSchema,
                selectedTab: 'roles'
            }, () => {
                this.listKubernetesRoles();
                this.getKubernetesAuthConfig();
            });
        }
    }

    render() {

        let renderNewRoleDialog = () => {
            let validateAndSubmit = () => {
                if (this.state.newRoleId === '') {
                    snackBarMessage(new Error('Role name cannot be empty'));
                    return;
                }

                if (_.indexOf(this.state.kubernetesRoles, this.state.newRoleId) > 0) {
                    snackBarMessage(new Error('Role already exists'));
                    return;
                }

                this.createUpdateRole(this.state.newRoleId);
            }

            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openNewRoleDialog: false });
                    }}
                />,
                <FlatButton
                    label='Create'
                    primary={true}
                    onTouchTap={validateAndSubmit}
                />
            ];

            return (
                <Dialog
                    title={`Register Kubernetes role`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewRoleDialog}
                    onRequestClose={() => this.setState({ openNewRoleDialog: false })}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Enter the new role name'
                            floatingLabelFixed={true}
                            floatingLabelText='Role Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleId: e.target.value });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='* for all'
                            floatingLabelFixed={true}
                            floatingLabelText='ServiceAccount Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_service_account_names: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='* for all'
                            floatingLabelFixed={true}
                            floatingLabelText='Kubernetes Namespace'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_service_account_namespaces: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='TTL'
                            value={this.state.newRoleConfig.ttl}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { ttl: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Max TTL'
                            value={this.state.newRoleConfig.max_ttl}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { max_ttl: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Period'
                            value={this.state.newRoleConfig.period}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { period: { $set: e.target.value } }) });
                            }}
                        />
                        <Subheader>Assigned Policies</Subheader>
                        <ItemPicker
                            height='200px'
                            selectedPolicies={this.state.newRoleConfig.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { policies: { $set: newPolicies } }) });
                            }}
                        />
                    </List>
                </Dialog>
            );
        }

        let renderEditRoleDialog = () => {
            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openEditRoleDialog: false, selectedRoleId: '' })
                        history.push(`${this.state.baseUrl}roles/`);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={() => {
                        this.createUpdateRole(this.state.selectedRoleId)
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Editing role ${this.state.selectedRoleId}`}
                    modal={false}
                    actions={actions}
                    open={this.state.openEditRoleDialog}
                    onRequestClose={() => {
                        this.setState({ openEditRoleDialog: false, selectedRoleId: '' });
                        history.push(`${this.state.baseUrl}roles/`);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='ServiceAccount Name'
                            value={this.state.newRoleConfig.bound_service_account_names}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_service_account_names: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Kubernetes Namespace'
                            value={this.state.newRoleConfig.bound_service_account_namespaces}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_service_account_namespaces: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='TTL'
                            value={this.state.newRoleConfig.ttl}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { ttl: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Max TTL'
                            value={this.state.newRoleConfig.max_ttl}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { max_ttl: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Period'
                            value={this.state.newRoleConfig.period}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { period: { $set: e.target.value } }) });
                            }}
                        />
                        <Subheader>Assigned Policies</Subheader>
                        <ItemPicker
                            height='250px'
                            selectedPolicies={this.state.newRoleConfig.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { policies: { $set: newPolicies } }) });
                            }}
                        />
                    </List>
                </Dialog>
            );
        }

        return (
            <div>
                {this.state.openEditRoleDialog && renderEditRoleDialog()}
                {this.state.openNewRoleDialog && renderNewRoleDialog()}
                <Tabs
                    onChange={(e) => {
                        history.push(`${this.state.baseUrl}${e}/`);
                        this.setState({ newConfigObj: _.clone(this.state.configObj) });
                    }}
                    value={this.state.selectedTab}
                >
                    <Tab
                        label='Manage Roles'
                        value='roles'
                        onActive={() => this.setState({ selectedTab: 'roles' })}
                        disabled={!this.state.isBackendConfigured}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure Kubernetes roles.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW ROLE'
                                        disabled={this.state.newSecretBtnDisabled}
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewRoleDialog: true,
                                                newRoleConfig: _.clone(this.roleConfigSchema)
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <ItemList
                                itemList={this.state.kubernetesRoles}
                                itemUri={`${this.state.baseVaultPath}/role`}
                                maxItemsPerPage={25}
                                onDeleteTap={(deleteItem) => {
                                    snackBarMessage(`Role '${deleteItem}' deleted`)
                                    this.listKubernetesRoles();
                                }}
                                onTouchTap={(role) => {
                                    tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${role}`)
                                        .then(() => {
                                            this.setState({ selectedRoleId: role });
                                            history.push(`${this.state.baseUrl}roles/${role}`);
                                        }).catch(() => {
                                            snackBarMessage(new Error('Access denied'));
                                        })

                                }}
                            />
                        </Paper>
                    </Tab>
                    <Tab
                        label='Configure Backend'
                        value='backend'
                        onActive={() => this.setState({ selectedTab: 'backend' })}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure connection details to your Kubernetes Service Account.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText='https://192.168.99.100:8443'
                                    floatingLabelText='Kubernetes API Server URL'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.kubernetes_host}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { kubernetes_host: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='optional'
                                    floatingLabelText='Service Account JWT (aaa.bbb.ccc)'
                                    fullWidth={true}
                                    type='password'
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.token_reviewer_jwt}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { token_reviewer_jwt: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='-----BEGIN CERTIFICATE-----.....-----END CERTIFICATE-----'
                                    floatingLabelText='CA Certificate Kubernetes API (without newlines)'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.kubernetes_ca_cert}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { kubernetes_ca_cert: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='optional'
                                    floatingLabelText='PEM Key(s) to verify the JWT signatures (without newlines)'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.pem_keys}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { pem_keys: { $set: e.target.value } }) });
                                    }}
                                />
                                <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                                    <FlatButton
                                        primary={true}
                                        label='Save'
                                        onTouchTap={() => this.createUpdateConfig()}
                                    />
                                </div>
                            </List>
                        </Paper>
                    </Tab>
                </Tabs>
            </div >
        );
    }

}