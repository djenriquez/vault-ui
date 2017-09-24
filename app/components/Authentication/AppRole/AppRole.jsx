import React, { PropTypes } from 'react';
// Material UI
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import { List } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import Toggle from 'material-ui/Toggle';

// Styles
import styles from './approle.css';
import sharedStyles from '../../shared/styles.css';
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import ItemPicker from '../../shared/ItemPicker/ItemPicker.jsx';
import ItemList from '../../shared/ItemList/ItemList.jsx';
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx';

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class AppRoleAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    itemConfigSchema = {
        role_name: undefined,
        bind_secret_id: undefined,
        bound_cidr_list: undefined,
        policies: [],
        secret_id_num_uses: undefined,
        secret_id_ttl: undefined,
        token_num_uses: undefined,
        token_ttl: undefined,
        token_max_ttl: undefined,
        period: undefined,
        role_id: undefined,
        secret_id: undefined
    }

    constructor(props) {
        super(props);

        this.baseUrl = `/auth/approle/${this.props.params.namespace}/`;
        this.baseVaultPath = `auth/${this.props.params.namespace}`;

        this.state = {
            deleteUserPath: '',
            selectedTab: 'roles',
            itemConfig: this.appRoleConfigSchema,
            openNewItemDialog: false,
            openEditItemDialog: false,
            selectedItemName: '',
            itemList: [],
            filteredItemList: []
        }

        _.bindAll(
            this,
            'listAppRoles',
            'getAppRoleConfig',
            'getAppRoleId',
            'updateRoleId'
        );
    }

    // Events
    componentDidMount() {
        this.listAppRoles();
        // If an approle is requested by URI
        let uri = this.props.location.pathname.split(this.baseUrl)[1];
        let roleName = uri.split('/')[1];
        if (roleName) {
            this.setState({ selectedItemName: roleName });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedItemName && (this.state.selectedItemName !== prevState.selectedItemName)) {
            this.getAppRoleConfig();
            this.getAppRoleId();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.baseUrl = `/auth/approle/${nextProps.params.namespace}/`;
            this.baseVaultPath = `auth/${nextProps.params.namespace}`;
            this.setState({
                deleteUserPath: '',
                selectedTab: 'roles',
                itemConfig: this.appRoleConfigSchema,
                openNewItemDialog: false,
                openEditItemDialog: false,
                selectedItemName: '',
                itemList: [],
                filteredItemList: []
            }, () => {
                history.push(`${this.baseUrl}`);
                this.listAppRoles()
            });
        }
    }

    getAppRoleConfig() {
        tokenHasCapabilities(['read'], `${this.baseVaultPath}/role/${this.state.selectedItemName}`)
            .then(() => {
                callVaultApi('get', `${this.baseVaultPath}/role/${this.state.selectedItemName}`, null, null)
                    .then((resp) => {
                        let appRole = _.get(resp, 'data.data', {});
                        this.setState({ itemConfig: appRole, openEditItemDialog: true });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ itemConfig: this.itemConfigSchema });
                        }
                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            });
    }

    getAppRoleId() {
        tokenHasCapabilities(['read'], `${this.baseVaultPath}/role/${this.state.selectedItemName}/role-id`)
            .then(() => {
                callVaultApi('get', `${this.baseVaultPath}/role/${this.state.selectedItemName}/role-id`, null, null)
                    .then((resp) => {
                        let roleId = _.get(resp, 'data.data.role_id', '');
                        this.setState({ itemConfig: update(this.state.itemConfig, { role_id: { $set: roleId } }) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ itemConfig: this.itemConfigSchema });
                        }
                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            });
    }

    listAppRoles() {
        tokenHasCapabilities(['list'], `${this.baseVaultPath}/role`)
            .then(() => {
                callVaultApi('get', `${this.baseVaultPath}/role`, { list: true }, null)
                    .then((resp) => {
                        let roles = _.get(resp, 'data.data.keys', []);
                        this.setState({ itemList: _.valuesIn(roles), filteredItemList: _.valuesIn(roles) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ itemList: [], filteredItemList: [] });
                        }
                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    listSecretIdAccessors() {
        tokenHasCapabilities(['list'], `${this.baseVaultPath}/role/${this.state.selectedItemName}/secret-id`)
            .then(() => {
                callVaultApi('get', `${this.baseVaultPath}/role/${this.state.selectedItemName}/secret-id`, { list: true }, null)
                    .then((resp) => {

                    })
                    .catch((error) => {
                        snackBarMessage(error);
                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    createUpdateItem() {
        let role_name = this.state.itemConfig.role_name ? this.state.itemConfig.role_name : this.state.selectedItemName;
        tokenHasCapabilities(['create', 'update'], `${this.baseVaultPath}/role/${role_name}`)
            .then(() => {
                let updateObj = _.clone(this.state.itemConfig);
                if (updateObj.policies.length > 0)
                    updateObj.policies = this.state.itemConfig.policies.join(',');
                else
                    updateObj.policies = '';
                callVaultApi('post', `${this.baseVaultPath}/role/${role_name}`, null, updateObj)
                    .then(() => {
                        history.push(`${this.baseUrl}`);
                        this.listAppRoles();
                        this.setState({ openEditItemDialog: false, openNewItemDialog: false, itemConfig: this.itemConfigSchema, selectedItemName: '' })
                    })
                    .catch((error) => {
                        snackBarMessage(error);
                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            });
    }

    updateRoleId() {
        if (this.state.itemConfig.role_id) {
            tokenHasCapabilities(['update'], `${this.baseVaultPath}/role/${this.state.selectedItemName}/role-id`)
                .then(() => {
                    callVaultApi('post', `${this.baseVaultPath}/role/${this.state.selectedItemName}/role-id`, null, { role_id: this.state.itemConfig.role_id })
                        .catch((error) => {
                            snackBarMessage(error);
                        })
                })
                .catch(() => {
                    snackBarMessage(new Error('Access denied'));
                });
        }
    }

    render() {
        let renderFields = () => {

            let renderNewFields = () => {
                return (
                    [
                        <TextField
                            className={styles.textFieldStyle}
                            hintText={`Enter the role name`}
                            floatingLabelFixed={true}
                            floatingLabelText='Role Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { role_name: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            }

            let renderEditFields = () => {
                return (
                    [
                        <TextField
                            key='role_id'
                            className={styles.textFieldStyle}
                            hintText={`Enter the Role ID`}
                            value={this.state.itemConfig.role_id}
                            floatingLabelFixed={true}
                            floatingLabelText='Role ID'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { role_id: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            }

            let renderConstantFields = () => {
                return (
                    [
                        <Toggle
                            label="Bind Secret ID"
                            toggled={this.state.itemConfig.bind_secret_id}
                            value={this.state.bind_secret_id}
                            style={{ width: 250 }}
                            onToggle={(e, v) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { bind_secret_id: { $set: v } }) });
                            }}
                        />,
                        <TextField
                            key='bound_cidr_list'
                            value={this.state.itemConfig.bound_cidr_list}
                            className={styles.textFieldStyle}
                            hintText={`Enter the CIDR blocks`}
                            floatingLabelFixed={true}
                            floatingLabelText='Bind CIDR list'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { bound_cidr_list: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='secret_id_num_uses'
                            value={this.state.itemConfig.secret_id_num_uses}
                            className={styles.textFieldStyle}
                            hintText={`# of Secret ID uses`}
                            floatingLabelFixed={true}
                            floatingLabelText='Secret ID # uses'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { secret_id_num_uses: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='secret_id_ttl'
                            value={this.state.itemConfig.secret_id_ttl}
                            className={styles.textFieldStyle}
                            hintText={`Secret ID TTL`}
                            floatingLabelFixed={true}
                            floatingLabelText='Secret ID TTL'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { secret_id_ttl: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='token_num_uses'
                            value={this.state.itemConfig.token_num_uses}
                            className={styles.textFieldStyle}
                            hintText={`Secret ID TTL`}
                            floatingLabelFixed={true}
                            floatingLabelText='Secret ID TTL'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { token_num_uses: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='token_ttl'
                            value={this.state.itemConfig.token_ttl}
                            className={styles.textFieldStyle}
                            hintText={`Token TTL`}
                            floatingLabelFixed={true}
                            floatingLabelText='Token TTL'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { token_ttl: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='token_max_ttl'
                            value={this.state.itemConfig.token_max_ttl}
                            className={styles.textFieldStyle}
                            hintText={`Token Max TTL`}
                            floatingLabelFixed={true}
                            floatingLabelText='Token Max TTL'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { token_max_ttl: { $set: e.target.value } }) });
                            }}
                        />,
                        <TextField
                            key='period'
                            value={this.state.itemConfig.period}
                            className={styles.textFieldStyle}
                            hintText={`Period`}
                            floatingLabelFixed={true}
                            floatingLabelText='Period'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { period: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            }
            return (
                <List>
                    {this.state.openNewItemDialog && renderNewFields()}
                    {this.state.openEditItemDialog && renderEditFields()}
                    {renderConstantFields()}
                    <Subheader>Assigned Groups</Subheader>
                    <ItemPicker
                        key='policies'
                        type={`approle`}
                        item={`policies`}
                        height='250px'
                        selectedPolicies={this.state.itemConfig.policies}
                        onSelectedChange={(policies) => {
                            this.setState({ itemConfig: update(this.state.itemConfig, { policies: { $set: policies } }) });
                        }}
                    />
                </List>
            )
        }
        let renderNewDialog = () => {

            let validateAndSubmit = () => {
                if (this.state.itemConfig.role_name === '') {
                    snackBarMessage(new Error(`Name cannot be empty`));
                    return;
                }

                this.createUpdateItem();
            }

            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.itemConfigSchema), selectedItemName: '' });
                        history.push(`${this.baseUrl}`);
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
                    title={`Create new role`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewItemDialog}
                    onRequestClose={() => this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.itemConfigSchema) })}
                    autoScrollBodyContent={true}
                >
                    {renderFields()}
                </Dialog>
            );
        };

        let renderEditDialog = () => {
            let validateAndSubmit = () => {
                this.createUpdateItem();
                this.updateRoleId();
            }

            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openEditItemDialog: false, itemConfig: _.clone(this.itemConfigSchema), selectedItemName: '' });
                        history.push(`${this.baseUrl}`);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={validateAndSubmit}
                />
            ];

            return (
                <Dialog
                    title={`Editing ${this.state.selectedItemName}`}
                    modal={false}
                    actions={actions}
                    open={this.state.openEditItemDialog}
                    onRequestClose={() => this.setState({ openEditItemDialog: false, itemConfig: _.clone(this.itemConfigSchema) })}
                    autoScrollBodyContent={true}
                >
                    {renderFields()}
                </Dialog>
            );
        };

        return (
            <div>
                {this.state.openNewItemDialog && renderNewDialog()}
                {this.state.openEditItemDialog && renderEditDialog()}
                <Tabs
                    onChange={(e) => {
                        history.push(`${this.baseUrl}${e}/`);
                        this.setState({ itemConfig: _.clone(this.state.itemConfig) });
                    }}
                    value={this.state.selectedTab}
                >
                    <Tab label='Manage Roles'
                        value='roles'
                        onActive={() => {
                            this.setState({ selectedTab: 'roles' });
                        }}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can add, edit or delete AppRoles with this backend
                        </Paper>
                        <Paper label='toolbar' className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW ROLE'
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewItemDialog: true,
                                                itemConfig: _.clone(this.itemConfigSchema)
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <ItemList
                                itemList={this.state.itemList}
                                itemUri={`${this.baseVaultPath}`}
                                maxItemsPerPage={25}
                                onDeleteTap={(deletedItem) => {
                                    snackBarMessage(`Object '${deletedItem}' deleted`)
                                    this.listAppRoles();
                                }}
                                onTouchTap={(item) => {
                                    this.setState({ itemConfig: _.clone(this.itemConfigSchema), selectedItemName: `${item}` });
                                    tokenHasCapabilities(['read'], `${this.baseVaultPath}/${item}`).then(() => {
                                        history.push(`${this.baseUrl}role/${item}`);
                                    }).catch(() => {
                                        snackBarMessage(new Error('Access denied'));
                                    })
                                }}
                            />
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
