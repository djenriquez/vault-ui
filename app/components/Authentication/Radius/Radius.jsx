import React, { PropTypes } from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import Avatar from 'material-ui/Avatar';
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import IconButton from 'material-ui/IconButton';
import { List, ListItem } from 'material-ui/List';
import sharedStyles from '../../shared/styles.css';
import styles from './radius.css';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import { red500 } from 'material-ui/styles/colors.js'
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx'
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'
import VaultObjectDeleter from '../../shared/DeleteObject/DeleteObject.jsx'
import update from 'immutability-helper';

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

class RadiusAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    radiusUserSchema = {
        policies: [
            'default'
        ]
    }

    radiusConfigSchema = {
        host: '',
        port: 1812,
        secret: '',
        dial_timeout: 10,
        read_timeout: 10,
        nas_port: 10,
        unregistered_user_policies: [],
    }

    constructor(props) {
        super(props);

        this.state = {
            baseUrl: `/auth/radius/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            userList: [],
            filteredUserList: [],
            newUserId: '',
            newUserObject: {},
            selectedUserId: '',
            selectedUserObject: {},
            deleteUserPath: '',
            configObj: this.radiusConfigSchema,
            newConfigObj: this.radiusConfigSchema,
            openNewUserDialog: false,
            openEditUserDialog: false
        }

        _.bindAll(
            this,
            'loadUserList',
            'CreateUpdateUser',
            'CreateUpdateConfig',
            'readConfig'
        );
    }


    loadUserList() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/users`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/users`, { list: true }, null, null)
                    .then((resp) => {
                        let userlist = _.map(resp.data.data.keys, (userid) => {
                            return { id: userid, path: `${this.state.baseVaultPath}/users/${userid}` };
                        })
                        this.setState({ userList: userlist, filteredUserList: userlist });
                    })
                    .catch((err) => {
                        // 404 is expected when no users are registered
                        if (!_.has(err, 'response') || err.response.status != 404)
                            snackBarMessage(err)
                    })
            })
            .catch(() => {
                this.setState({ userList: [], filteredUserList: [] })
                snackBarMessage(new Error(`No permissions to list users`));
            })
    }

    displayUser() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/users/${this.props.params.splat}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/users/${this.props.params.splat}`, null, null, null)
                    .then((resp) => {
                        this.setState({ selectedUserObject: resp.data.data, openEditUserDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ selectedUserObject: {} })
                snackBarMessage(new Error(`No permissions to display properties for user ${this.props.params.splat}`));
            })
    }

    readConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/config`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/config`, null, null, null)
                    .then((resp) => {
                        this.setState({ configObj: resp.data.data, newConfigObj: resp.data.data });
                    })
                    .catch((err) => {
                        // 404 is expected when backend is not configured
                        if (!_.has(err, 'response') || err.response.status != 404)
                            snackBarMessage(err)
                    })
            })
            .catch(() => {
                snackBarMessage(new Error(`No permissions to read backend configuration`));
            })
    }

    componentDidMount() {
        if (this.props.params.splat) {
            this.setState({ selectedUserId: this.props.params.splat });
        } else {
            this.loadUserList();
        }
        this.readConfig();
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/radius/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                userList: [],
                filteredUserList: [],
                selectedUserId: '',
                newConfigObj: this.radiusConfigSchema,
                configObj: this.radiusConfigSchema
            }, () => {
                this.loadUserList();
                this.readConfig();
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedUserId != prevState.selectedUserId) {
            this.loadUserList()
            if (this.state.selectedUserId) {
                this.displayUser();
            }
        }
    }

    CreateUpdateUser(userid, userobj, create = false) {
        let fullpath = `${this.state.baseVaultPath}/users/${userid}`;
        let policiesStr = userobj.policies.join(',');
        callVaultApi('post', fullpath, null, { policies: policiesStr }, null)
            .then(() => {
                if (create) {
                    this.loadUserList();
                    this.setState({ openNewUserDialog: false, newUserId: '' });
                    snackBarMessage(`User ${userid} has been registered`);
                } else {
                    history.push(this.state.baseUrl);
                    this.setState({ openEditUserDialog: false, selectedUserId: '' });
                    snackBarMessage(`User ${userid} has been updated`);
                }
            })
            .catch(snackBarMessage)
    }

    CreateUpdateConfig(newConfig) {
        let origConfig = this.state.configObj;
        var diff = _.omitBy(newConfig, function (v, k) {
            return origConfig[k] === v;
        });
        if (_.has(diff, 'unregistered_user_policies')) {
            diff.unregistered_user_policies = diff.unregistered_user_policies.join(',')
        }
        let fullpath = `${this.state.baseVaultPath}/config`;
        callVaultApi('post', fullpath, null, diff, null)
            .then(() => {
                snackBarMessage(`Backend ${fullpath} has been configured`);
            })
            .catch(snackBarMessage)
    }

    render() {
        let renderUserListItems = () => {
            return _.map(this.state.filteredUserList, (userobj) => {
                let avatar = (<Avatar icon={<ActionAccountBox />} />);
                let action = (
                    <IconButton
                        tooltip="Delete"
                        onTouchTap={() => this.setState({ deleteUserPath: userobj.path })}
                    >
                        {window.localStorage.getItem("showDeleteModal") === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                    </IconButton>
                );

                let item = (
                    <ListItem
                        key={userobj.id}
                        primaryText={userobj.id}
                        insetChildren={true}
                        leftAvatar={avatar}
                        rightIconButton={action}
                        onTouchTap={() => {
                            this.setState({ newUserId: '' });
                            tokenHasCapabilities(['read'], userobj.path).then(() => {
                                this.setState({ selectedUserId: userobj.id });
                                history.push(`${this.state.baseUrl}${userobj.id}`);
                            }).catch(() => {
                                snackBarMessage(new Error("Access denied"));
                            })

                        }}
                    />
                )
                return item;
            });
        }

        let renderEditUserDialog = () => {
            const actions = [
                <FlatButton
                    label="Cancel"
                    onTouchTap={() => {
                        this.setState({ openEditUserDialog: false, selectedUserId: '' })
                        history.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label="Save"
                    primary={true}
                    onTouchTap={() => {
                        this.CreateUpdateUser(this.state.selectedUserId, this.state.selectedUserObject, false)
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Editing RADIUS user ${this.state.selectedUserId}`}
                    modal={false}
                    actions={actions}
                    open={this.state.openEditUserDialog}
                    onRequestClose={() => this.setState({ openEditUserDialog: false, selectedUserId: '' })}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
                            type="Radius"
                            height="250px"
                            selectedPolicies={this.state.selectedUserObject.policies}
                            onSelectedChange={(policies) => {
                                let user = this.state.selectedUserObject;
                                user.policies = policies;
                                this.setState({ selectedUserObject: user });
                            }}
                        />
                    </List>
                </Dialog>
            );
        }

        let renderNewUserDialog = () => {
            let validateAndSubmit = () => {
                if (this.state.newUserId === '') {
                    snackBarMessage(new Error("User Name cannot be empty"));
                    return;
                }

                if (!_.every(this.state.userList, (k) => { return k.id != this.state.newUserId })) {
                    snackBarMessage(new Error("User already exists"));
                    return;
                }

                this.CreateUpdateUser(this.state.newUserId, this.state.newUserObject, true);
                this.setState({ openNewUserDialog: false, newUserId: '' });
            }

            const actions = [
                <FlatButton
                    label="Cancel"
                    onTouchTap={() => {
                        this.setState({ openNewUserDialog: false, newUserId: '' })
                    }}
                />,
                <FlatButton
                    label="Create"
                    primary={true}
                    onTouchTap={validateAndSubmit}
                />
            ];

            return (
                <Dialog
                    title={`Register new RADIUS user`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewUserDialog}
                    onRequestClose={() => this.setState({ openNewUserDialog: false, newUserId: '' })}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText="Enter the new user name"
                            floatingLabelFixed={true}
                            floatingLabelText="User Name"
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newUserId: e.target.value });
                            }}
                        />
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
                            height="200px"
                            selectedPolicies={this.state.newUserObject.policies}
                            onSelectedChange={(policies) => {
                                let user = this.state.newUserObject;
                                user.policies = policies;
                                this.setState({ newUserObject: user });
                            }}
                        />
                    </List>
                </Dialog>
            );
        }

        return (
            <div>
                {this.state.openEditUserDialog && renderEditUserDialog()}
                {this.state.openNewUserDialog && renderNewUserDialog()}
                <VaultObjectDeleter
                    path={this.state.deleteUserPath}
                    onReceiveResponse={() => {
                        snackBarMessage(`Object '${this.state.deleteUserPath}' deleted`)
                        this.setState({ deleteUserPath: '' })
                        this.loadUserList();
                    }}
                    onReceiveError={(err) => snackBarMessage(err)}
                />
                <Tabs>
                    <Tab label="Manage users" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can add, edit or delete users registred with this backend
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label="NEW USER"
                                        disabled={this.state.newSecretBtnDisabled}
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewUserDialog: true,
                                                newUserId: '',
                                                newUserObject: _.clone(this.radiusUserSchema)
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                                <ToolbarGroup lastChild={true}>
                                    <TextField
                                        floatingLabelFixed={true}
                                        floatingLabelText="Filter"
                                        hintText="Filter list items"
                                        onChange={(e, v) => {
                                            let filtered = _.filter(this.state.userList, (item) => {
                                                return item.id.toLowerCase().includes(v.toLowerCase());
                                            });
                                            if (filtered.length > 0)
                                                this.setState({
                                                    filteredUserList: filtered
                                                });
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <List className={sharedStyles.listStyle}>
                                {renderUserListItems()}
                            </List>
                        </Paper>
                    </Tab>
                    <Tab label="Configure Backend" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure connection details to your RADIUS server. Optionally you can assign a default set of policies to assign to unregistred users
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText="Enter the RADIUS server host in hostname or IP form"
                                    floatingLabelText="RADIUS Server Host"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.host}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { host: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the RADIUS server port"
                                    floatingLabelText="RADIUS Server Port"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    type="number"
                                    value={this.state.newConfigObj.port}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { port: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the RADIUS shared secret"
                                    floatingLabelText="RADIUS Shared Secret"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    type="password"
                                    value={this.state.newConfigObj.secret}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { secret: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the RADIUS NAS port"
                                    floatingLabelText="RADIUS NAS Port"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    type="number"
                                    value={this.state.newConfigObj.nas_port}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { nas_port: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the connect timeout in seconds"
                                    floatingLabelText="Connect Timeout"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    type="number"
                                    value={this.state.newConfigObj.dial_timeout}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { dial_timeout: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the response timeout in seconds"
                                    floatingLabelText="Response Timeout"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    type="number"
                                    value={this.state.newConfigObj.read_timeout}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { read_timeout: { $set: e.target.value } }) });
                                    }}
                                />
                                <Subheader>Unregistered Users Policies</Subheader>
                                <PolicyPicker
                                    height="250px"
                                    selectedPolicies={this.state.newConfigObj.unregistered_user_policies}
                                    onSelectedChange={(policies) => {
                                        let user = this.state.selectedUserObject;
                                        user.policies = policies;
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { unregistered_user_policies: { $set: policies } }) });
                                    }}
                                />
                                <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                                    <FlatButton
                                        primary={true}
                                        label="Save"
                                        onTouchTap={() => this.CreateUpdateConfig(this.state.newConfigObj)}
                                    />
                                </div>
                            </List>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}

export default RadiusAuthBackend;