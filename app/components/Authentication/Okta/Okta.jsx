import React, { PropTypes } from 'react';
// Material UI
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import { List, ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Avatar from 'material-ui/Avatar';
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
// Styles
import styles from './okta.css';
import sharedStyles from '../../shared/styles.css';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js';
import Checkbox from 'material-ui/Checkbox';
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx';
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'
// Misc
import _ from 'lodash';
import update from 'immutability-helper';

function snackBarMessage(message) {
    let ev = new CustomEvent('snackbar', { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class OktaAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    oktaItemSchema = {
        name: '',
        items: []
    };

    oktaConfigSchema = {
        organization: '',
        token: null,
        base_url: null
    };


    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/okta/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            userList: [],
            filteredUserList: [],
            groupList: [],
            filteredGroupList: [],
            openNewItemDialog: false,
            openItemDialog: false,
            itemConfig: this.oktaItemSchema,
            deleteUserPath: '',
            configObj: this.oktaConfigSchema,
            selectedTab: 'users',
            selectedItemId: '',
            isBackendConfigured: false
        };

        _.bindAll(
            this,
            'createUpdateItem',
            'createUpdateConfig',
            'getOktaBackendConfig',
            'listOktaUsers',
            'listOktaGroups',
            'displayItem'
        );

    }

    componentWillMount() {
        let tab = this.props.location.pathname.split(this.state.baseUrl)[1];
        if (!tab) {
            history.push(`${this.state.baseUrl}${this.state.selectedTab}/`);
        } else {
            this.setState({ selectedTab: tab.includes('/') ? tab.split('/')[0] : tab });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedItemId !== prevState.selectedItemId) {
            this.listOktaGroups();
            this.listOktaUsers();
            if (this.state.selectedItemId) {
                let params = this.state.selectedItemId.split('/');
                if (params.length > 0) {
                    this.setState({ selectedTab: params[0] });
                    if (params.length > 1 && params[1]) {
                        this.displayItem();
                    }
                }
            }
        }
    }

    componentDidMount() {
        this.getOktaBackendConfig();
        this.listOktaGroups();
        this.listOktaUsers();
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/okta/${this.props.params.namespace}/`,
                baseVaultPath: `auth/${this.props.params.namespace}`,
                userList: [],
                selectedTab: 'users',
                configObj: this.oktaConfigSchema,
                itemConfig: this.oktaItemSchema
            }, () => {
                history.push(`${this.state.baseUrl}users`);
                this.getOktaBackendConfig();
                this.listOktaGroups();
                this.listOktaUsers();
            });
        }
    }
    // 
    displayItem() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/${this.state.selectedItemId}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/${this.state.selectedItemId}`, null, null, null)
                    .then((resp) => {
                        let item = _.get(resp, 'data.data', {});
                        item.name = this.state.selectedItemId.split('/')[1];

                        let policies = _.get(item, 'value', undefined);
                        item.policies = policies ? policies.split(',') : [];

                        this.setState({ itemConfig: item, openItemDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ selectedItemId: '' })
                snackBarMessage(new Error(`No permissions to display properties for ${this.state.selectedItemId}`));
            })
    }

    listOktaUsers() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/users`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/users`, { list: true }, null)
                    .then((resp) => {
                        let users = _.get(resp, 'data.data.keys', []);
                        this.setState({ userList: _.valuesIn(users), filteredUserList: _.valuesIn(users) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ userList: [], filteredUserList: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    listOktaGroups() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/groups`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/groups`, { list: true }, null)
                    .then((resp) => {
                        let groups = _.get(resp, 'data.data.keys', []);
                        this.setState({ groupList: _.valuesIn(groups), filteredGroupList: _.valuesIn(groups) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ groupList: [], filteredGroupList: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    getOktaBackendConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/config`, null, null, null)
                    .then((resp) => {
                        let config = resp.data.data;

                        this.setState({
                            configObj: update(this.state.configObj,
                                {
                                    token: { $set: (config.token ? config.token : null) },
                                    organization: { $set: config.Org },
                                    base_url: { $set: (config.BaseURL ? config.BaseURL : null) }
                                }),
                            isBackendConfigured: true
                        });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            error.message = `This backend has not yet been configured`;
                            this.setState({ selectedTab: 'backend', isBackendConfigured: false, configObj: this.oktaConfigSchema });
                            history.push(`${this.state.baseUrl}backend`);
                            snackBarMessage(error);
                        }
                    })
            })
            .catch(new Error('Access denied'));
    }

    createUpdateItem(name) {
        console.log(`Updating ${name} at ${this.state.baseVaultPath}/${this.state.selectedTab}/${name}`);
        console.log(this.state.itemConfig);
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/${this.state.selectedTab}/${name}`)
            .then(() => {
                let updateObj = {};
                if (this.state.selectedTab == 'users')
                    updateObj.groups = this.state.itemConfig.items.join(',');
                else
                    updateObj.policies = this.state.itemConfig.items.join(',');
                callVaultApi('post', `${this.state.baseVaultPath}/${this.state.selectedTab}/${name}`, null, updateObj)
                    .then(() => {
                        snackBarMessage(`Okta ${this.state.selectedTab.substring(0, this.state.selectedTab.length - 1)} ${name} has been updated`);
                        this.listOktaUsers();
                        this.listOktaGroups();
                        this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.oktaItemSchema), selectedItemId: '' });
                        history.push(this.state.baseUrl);
                    })
                    .catch(snackBarMessage);
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to update properties for item ${name}`));
            })
    }

    createUpdateConfig(configObj, create = false) {
        console.log('Updating config:');
        console.log(this.state.configObj);
        tokenHasCapabilities(['update'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('post', `${this.state.baseVaultPath}/config`, null, this.state.configObj, null)
                    .then(() => {
                        snackBarMessage(`Backend ${this.state.baseVaultPath}/config has been updated`);
                        if (!this.state.isBackendConfigured)
                            this.setState({ isBackendConfigured: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(new Error('Access denied'));
    }

    render() {
        let renderNewDialog = () => {
            let itemType = this.state.selectedTab == 'groups' ? 'group' : 'user';
            let validateAndSubmit = () => {
                if (this.state.itemConfig.name === '') {
                    snackBarMessage(new Error(`Name cannot be empty`));
                    return;
                }

                if (!_.every(this.state.userList, (k) => { return k.name != this.state.itemConfig.name })) {
                    snackBarMessage(new Error(`${itemType} ${this.state.itemConfig.name} already exists`));
                    return;
                }

                this.createUpdateItem(this.state.itemConfig.name);
                this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.oktaItemSchema) });
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
                />
            ];

            return (
                <Dialog
                    title={`Register new Okta ${itemType}`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewItemDialog}
                    onRequestClose={() => this.setState({ openNewItemDialog: false, itemConfig: _.clone(this.oktaItemSchema) })}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText={`Enter the new ${itemType} name`}
                            floatingLabelFixed={true}
                            floatingLabelText='New Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { name: { $set: e.target.value } }) });
                            }}
                        />
                        <Subheader>Assigned Groups</Subheader>
                    </List>
                </Dialog>
            );
        }

        // this will render the list of users defined
        let renderListItems = () => {
            let list = this.state.selectedTab == 'users' ? this.state.userList : this.state.groupList;
            return _.map(list, (item) => {
                let avatar = (<Avatar icon={<ActionAccountBox />} />);
                let action = (
                    <IconButton
                        tooltip='Delete'
                        onTouchTap={() => this.setState({ deleteUserPath: `${this.state.baseVaultPath}/${this.state.selectedTab}/${item}` })}
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
                            this.setState({ itemConfig: _.clone(this.oktaItemSchema), selectedItemId: `${this.state.selectedTab}/${item}` });
                            tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/${this.state.selectedTab}/${item}`).then(() => {
                                history.push(`${this.state.baseUrl}${this.state.selectedTab}/${item}`);
                            }).catch(() => {
                                snackBarMessage(new Error('Access denied'));
                            })

                        }}
                    />
                )
                return obj;
            });
        }

        let renderItemDialog = () => {
            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openItemDialog: false, selectedItemId: '' });
                        history.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={() => {
                        this.createUpdateItem(this.state.selectedItemId.split('/')[1]);
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Editing Okta ${this.state.selectedTab.substring(0, this.state.selectedTab.length - 1)} '${this.state.selectedItemId}'`}
                    modal={false}
                    actions={actions}
                    open={this.state.openItemDialog}
                    onRequestClose={() => {
                        this.setState({ openItemDialog: false, selectedItemId: '' });
                        history.push(this.state.baseUrl);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <Subheader>Assigned Items</Subheader>
                        //Need to create a different picker that allows picking more than policies
                        <PolicyPicker
                            height='250px'
                            selectedPolicies={this.state.itemConfig.items}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { items: { $set: newPolicies } }) });
                            }}
                        />
                    </List>
                </Dialog>
            );
        };

        return (
            <div>
                {this.state.openNewItemDialog && renderNewDialog()}
                {this.state.openItemDialog && renderItemDialog()}
                <Tabs
                    onChange={(e) => {
                        history.push(`${this.state.baseUrl}${e}/`);
                        this.setState({ configObj: _.clone(this.state.configObj) });
                    }}
                    value={this.state.selectedTab}
                >
                    <Tab label='Manage Users'
                        value='users'
                        onActive={() => {
                            this.setState({ selectedTab: 'users' });
                        }}
                        disabled={!this.state.isBackendConfigured}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can add, edit or delete users registered with this backend
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW USER'
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewItemDialog: true,
                                                itemConfig: _.clone(this.oktaItemSchema)
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
                    <Tab label='Manage Groups'
                        value='groups'
                        onActive={() => {
                            this.setState({ selectedTab: 'groups' });
                        }}
                        disabled={!this.state.isBackendConfigured}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can add, edit or delete groups registered with this backend
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW GROUP'
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewItemDialog: true,
                                                itemConfig: _.clone(this.oktaItemSchema)
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
                    <Tab label='Configure Backend'
                        value='backend'
                        onActive={() => {
                            this.setState({ selectedTab: 'backend' });
                        }}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure connection details to your Okta account.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText='Enter your Okta organization name'
                                    floatingLabelText='Okta organization'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.configObj.organization}
                                    onChange={(e) => {
                                        this.setState({ configObj: update(this.state.configObj, { organization: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='Enter your Okta API token'
                                    floatingLabelText='Okta API token'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.configObj.token}
                                    onChange={(e) => {
                                        this.setState({ configObj: update(this.state.configObj, { token: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='okta.com'
                                    floatingLabelText='Okta url'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.configObj.base_url}
                                    onChange={(e) => {
                                        this.setState({ configObj: update(this.state.configObj, { base_url: { $set: e.target.value } }) });
                                    }}
                                />
                                <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                                    <FlatButton
                                        primary={true}
                                        label='Save'
                                        onTouchTap={() => this.createUpdateConfig(this.state.configObj)}
                                    />
                                </div>
                            </List>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

