import React, { PropTypes } from 'react';
// Material UI
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import { List, ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Avatar from 'material-ui/Avatar';
import Toggle from 'material-ui/Toggle';
import { red500 } from 'material-ui/styles/colors.js';

// Styles
import styles from './approle.css';
import sharedStyles from '../../shared/styles.css';
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'
import VaultObjectDeleter from '../../shared/DeleteObject/DeleteObject.jsx'
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx';

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class AppRoleAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired
    };

    itemConfigSchema = {
        role_name: undefined,
        bind_secret_id: undefined,
        bind_cidr_list: undefined,
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
        this.state = {
            baseUrl: `/auth/approle/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
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
            'listAppRoles'
        );
    }

    // Events
    componentDidMount() {
        this.listAppRoles();
    }

    listAppRoles() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/role`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role`, { list: true }, null)
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
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/role/${this.state.selectedItemName}/secret-id`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role/${this.state.selectedItemName}/secret-id`, { list: true }, null)
                    .then((resp) => {

                    })
                    .catch((error) => {

                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    getAppRoleConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${this.state.selectedItemName}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role/${this.state.selectedItemName}`, { list: true }, null)
                    .then((resp) => {

                    })
                    .catch((error) => {

                    })
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })

    }

    createUpdateItem() {
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/role/${this.state.itemConfig.role_name}`)
            .then(() => {
                let updateObj = _.clone(this.state.itemConfig);
                if (updateObj.policies.length > 0)
                    updateObj.policies = this.state.itemConfig.policies.join(',');
                callVaultApi('post', `${this.state.baseVaultPath}/role/${this.state.itemConfig.role_name}`, null, updateObj)
                    .then((resp) => {

                    })
                    .catch((error) => {

                    })
            })
            .catch((error) => {
                snackBarMessage(new Error('Access denied'));
            })
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

            }

            let renderConstantFields = () => {
                return (
                    [
                        <ListItem primaryText='Bind Secret ID'>
                            <Toggle
                                toggled={this.state.itemConfig.bind_secret_id}
                                onToggle={(e, v) => {
                                    this.setState({ itemConfig: update(this.state.itemConfig, { bind_secret_id: { $set: v } }) });
                                }}
                            />
                        </ListItem>,
                        <TextField
                            className={styles.textFieldStyle}
                            hintText={`Enter the CIDR blocks`}
                            floatingLabelFixed={true}
                            floatingLabelText='Bind CIDR list'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                let val = e.target.value.split(',');
                                this.setState({ itemConfig: update(this.state.itemConfig, { bind_cidr_list: { $set: val } }) });
                            }}
                        />,
                        <TextField
                            className={styles.textFieldStyle}
                            hintText={`# of Secret ID uses`}
                            floatingLabelFixed={true}
                            floatingLabelText='Secret ID # uses'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { secret_id_num_uses: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            }
            return (
                <List>
                    {this.state.openNewItemDialog && renderNewFields()}
                    {renderConstantFields()}
                    <Subheader>Assigned Groups</Subheader>
                    <PolicyPicker
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

                this.createUpdateItem(this.state.itemConfig.role_name);
            }

            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.oktaItemSchema) })
                    }}
                />,
                <FlatButton
                    label='Create'
                    primary={true}
                    onTouchTap={validateAndSubmit}
                    disableCreate={this.state.disableCreate}
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

        };

        let renderListItems = () => {
            let list = this.state.itemList;
            return _.map(list, (item) => {
                let avatar = (<Avatar icon={<ActionAccountBox />} />);
                let action = (
                    <IconButton
                        tooltip='Delete'
                        onTouchTap={() => this.setState({ deleteUserPath: `${this.state.baseVaultPath}/role/${item}` })}
                    >
                        {window.localStorage.getItem('showDeleteModal') === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                    </IconButton>
                );

                let obj = (
                    <ListItem
                        key={item}
                        primaryText={item}
                        insetChildren={true}
                        leftAvatar={avatar}
                        rightIconButton={action}
                        onTouchTap={() => {
                            this.setState({ itemConfig: _.clone(this.itemConfigSchema), selectedItemName: `${this.state.selectedTab}/${item}` });
                            tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${item}`).then(() => {
                                history.push(`${this.state.baseUrl}role/${item}`);
                            }).catch(() => {
                                snackBarMessage(new Error('Access denied'));
                            })

                        }}
                    />
                )
                return obj;
            });
        };

        return (
            <div>
                {this.state.openNewItemDialog && renderNewDialog()}
                {this.state.openNewItemDialog && renderEditDialog()}
                <VaultObjectDeleter
                    path={this.state.deleteUserPath}
                    onReceiveResponse={() => {
                        snackBarMessage(`Object '${this.state.deleteUserPath}' deleted`)
                        this.setState({ deleteUserPath: '' })
                        this.listAppRoles();
                    }}
                    onReceiveError={(err) => snackBarMessage(err)}
                />
                <Tabs
                    onChange={(e) => {
                        history.push(`${this.state.baseUrl}${e}/`);
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
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
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
                            <List className={sharedStyles.listStyle}>
                                {renderListItems()}
                            </List>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
