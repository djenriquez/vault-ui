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
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Toggle from 'material-ui/Toggle';
import Avatar from 'material-ui/Avatar';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js';
import Checkbox from 'material-ui/Checkbox';

// Styles
import styles from './github.css';
import sharedStyles from '../../shared/styles.css';
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import { browserHistory } from 'react-router'
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'
import VaultObjectDeleter from '../../shared/DeleteObject/DeleteObject.jsx'
import { callVaultApi, tokenHasCapabilities } from '../../shared/VaultUtils.jsx';

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class GithubAuthBackend extends React.Component {
    backendConfigSchema = {
        organization: '',
        base_url: undefined,
        max_ttl: undefined,
        ttl: undefined
    }

    itemConfigSchema = {
        id: '',
        policies: []
    }

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/github/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            teams: [],
            users: [],
            config: this.backendConfigSchema,
            newConfig: this.backendConfigSchema,
            itemConfig: this.teamConfigSchema,
            selectedItemId: '',
            newItemId: '',
            isBackendConfigured: false,
            openItemDialog: false,
            selectedTab: 'team',
            deleteUserPath: ''
        };

        _.bindAll(
            this,
            'listGithubTeams',
            'listGithubUsers',
            'getOrgConfig',
            'displayItem'
        );
    }

    listGithubTeams() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/map/teams`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/map/teams`, { list: true }, null)
                    .then((resp) => {
                        let teams = _.get(resp, 'data.data.keys', []);
                        this.setState({ teams: _.valuesIn(teams) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ teams: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    listGithubUsers() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/map/users`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/map/users`, { list: true }, null)
                    .then((resp) => {
                        let users = _.get(resp, 'data.data.keys', []);
                        this.setState({ users: _.valuesIn(users) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ users: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    getOrgConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/config`, null, null)
                    .then((resp) => {
                        let config = _.get(resp, 'data.data', this.backendConfigSchema);
                        if (!config.organization) {
                            this.setState({ selectedTab: 'backend', isBackendConfigured: false });
                            snackBarMessage(new Error(`This backend has not yet been configured`));
                        } else {
                            this.setState({
                                config: config,
                                newConfig: config,
                                isBackendConfigured: true
                            });
                        }
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            error.message = `This backend has not yet been configured`;
                            this.setState({ selectedTab: 'backend' });
                            snackBarMessage(error);
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    displayItem() {
        let itemId = this.state.selectedTab;
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/map/${itemId}s/${this.state.selectedItemId}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/map/${itemId}s/${this.state.selectedItemId}`, null, null, null)
                    .then((resp) => {
                        resp.data.data.id = itemId;
                        this.setState({ itemConfig: resp.data.data, openItemDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ selectedItemId: '' })
                snackBarMessage(new Error(`No permissions to display properties for ${itemId} ${this.state.selectedItemId}`));
            })
    }

    createUpdateConfig() {
        callVaultApi('post', `${this.state.baseVaultPath}/config`, null, this.state.newConfig)
            .then(() => {
                snackBarMessage(`Backend ${this.state.baseVaultPath}/config has been updated`);
                this.setState({ isBackendConfigured: this.state.newConfig.organization, config: this.state.newConfig });
            })
            .catch(snackBarMessage);
    }

    createUpdateRole(id) {
        let itemId = this.state.selectedTab;
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/map/${itemId}s/${id}`)
            .then(() => {
                let updateObj = _.clone(this.state.itemConfig);
                callVaultApi('post', `${this.state.baseVaultPath}/map/${itemId}s/${id}`, null, updateObj)
                    .then(() => {
                        snackBarMessage(`GitHub ${this.state.selectedTab} ${id} has been updated`);
                        this.listGithubTeams();
                        this.listGithubUsers();
                        this.setState({ openItemDialog: false, openNewItemDialog: false, itemConfig: _.clone(this.itemConfigSchema), selectedItemId: '' });
                        browserHistory.push(this.state.baseUrl);
                    })
                    .catch(snackBarMessage);
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to display properties for role ${id}`));
            })
    }

    componentDidMount() {
        if (this.props.params.splat) {
            this.setState({ selectedItemId: this.props.params.splat });
        } else {
            this.listGithubTeams();
            this.listGithubUsers();
        }
        this.getOrgConfig();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedItemId !== prevState.selectedItemId) {
            this.listGithubTeams();
            this.listGithubUsers();
            if (this.state.selectedItemId) {
                this.displayItem();
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/github/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                users: [],
                teams: [],
                selectedItemId: '',
                newConfig: this.backendConfigSchema,
                config: this.backendConfigSchema,
                selectedTab: 'team',
                isBackendConfigured: false
            }, () => {
                this.listGithubTeams();
                this.listGithubUsers();
                this.getOrgConfig();
            });
        }
    }

    render() {
        let renderListItems = () => {
            let items = this.state.selectedTab === 'team' ? this.state.teams : this.state.users;
            return _.map(items, (item) => {
                let avatar = (<Avatar icon={<ActionAccountBox />} />);
                let action = (
                    <IconButton
                        tooltip='Delete'
                        onTouchTap={() => this.setState({ deleteUserPath: `${this.state.baseVaultPath}/map/${this.state.selectedTab}s/${item}` })}
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
                            tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/${this.state.selectedTab}/${item}`)
                                .then(() => {
                                    this.setState({ selectedItemId: item });
                                    browserHistory.push(`${this.state.baseUrl}${item}`);
                                }).catch(() => {
                                    snackBarMessage(new Error('Access denied'));
                                })

                        }}
                    />
                )
                return obj;
            });
        }

        let renderPolicyDialog = () => {
            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openItemDialog: false, selectedItemId: '' });
                        browserHistory.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={() => {
                        this.createUpdateRole(this.state.selectedItemId);
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Editing GitHub ${this.state.selectedTab} '${this.state.selectedItemId}'`}
                    modal={false}
                    actions={actions}
                    open={this.state.openItemDialog}
                    onRequestClose={() => {
                        this.setState({ openItemDialog: false, selectedItemId: '' });
                        browserHistory.push(this.state.baseUrl);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
                            height='250px'
                            selectedPolicies={this.state.itemConfig.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { policies: { $set: newPolicies } }) });
                            }}
                        />
                    </List>
                </Dialog>
            );
        };

        let renderNewPolicyDialog = () => {
            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openNewItemDialog: false, newItemId: '' });
                        browserHistory.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={() => {
                        this.createUpdateRole(this.state.newItemId);
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Adding new ${this.state.selectedTab}`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewItemDialog}
                    onRequestClose={() => {
                        this.setState({ openNewItemDialog: false, newItemId: '' });
                        browserHistory.push(this.state.baseUrl);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Enter the new name'
                            floatingLabelFixed={true}
                            floatingLabelText='Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newItemId: e.target.value });
                            }}
                        />
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
                            height='250px'
                            selectedPolicies={this.state.itemConfig.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ itemConfig: update(this.state.itemConfig, { policies: { $set: newPolicies } }) });
                            }}
                        />
                    </List>
                </Dialog>
            );
        };

        return (
            <div>
                {this.state.openItemDialog && renderPolicyDialog()}
                {this.state.openNewItemDialog && renderNewPolicyDialog()}
                <VaultObjectDeleter
                    path={this.state.deleteUserPath}
                    onReceiveResponse={() => {
                        snackBarMessage(`GitHub ${this.state.selectedTab} '${this.state.deleteUserPath}' deleted`)
                        this.setState({ deleteUserPath: '' })
                        this.listGithubTeams();
                        this.listGithubUsers();
                    }}
                    onReceiveError={(err) => snackBarMessage(err)}
                />
                <Tabs
                    onChange={() => this.setState({ newConfig: _.clone(this.state.config) })}
                    value={this.state.selectedTab}
                >
                    <Tab
                        label='Manage Teams'
                        value='team'
                        onActive={() => this.setState({ selectedTab: 'team' })}
                        disabled={!this.state.isBackendConfigured}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure Github teams.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW TEAM'
                                        onTouchTap={() => {
                                            this.setState({
                                                newItemId: '',
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
                    <Tab
                        label='Manage Users'
                        value='user'
                        onActive={() => this.setState({ selectedTab: 'user' })}
                        disabled={!this.state.isBackendConfigured}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure Github users.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW USER'
                                        onTouchTap={() => {
                                            this.setState({
                                                newItemId: '',
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
                    <Tab
                        label='Configure Backend'
                        value='backend'
                        onActive={() => this.setState({ selectedTab: 'backend' })}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure details to your GitHub account.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText='Organization'
                                    floatingLabelText='GitHub Organization'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfig.organization}
                                    onChange={(e) => {
                                        this.setState({ newConfig: update(this.state.newConfig, { organization: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='www.mygithub.com'
                                    floatingLabelText='GitHub endpoint'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfig.endpoint}
                                    onChange={(e) => {
                                        this.setState({ newConfig: update(this.state.newConfig, { endpoint: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='1800000'
                                    floatingLabelText='TTL'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfig.ttl}
                                    onChange={(e) => {
                                        this.setState({ newConfig: update(this.state.newConfig, { ttl: { $set: e.target.value } }) });
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