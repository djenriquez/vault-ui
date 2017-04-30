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
import Toggle from 'material-ui/Toggle';
// Styles
import styles from './awsec2.css';
import sharedStyles from '../../shared/styles.css';
import { red500 } from 'material-ui/styles/colors.js';
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx';
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import Avatar from 'material-ui/Avatar';
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'
import VaultObjectDeleter from '../../shared/DeleteObject/DeleteObject.jsx'

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class AwsEc2AuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    ec2ConfigSchema = {
        access_key: '',
        endpoint: undefined,
        secret_key: ''
    };

    roleConfigSchema = {
        bound_ami_id: undefined,
        bound_account_id: undefined,
        bound_region: undefined,
        bound_vpc_id: undefined,
        bound_subnet_id: undefined,
        bound_iam_role_arn: undefined,
        bound_iam_instance_profile_arn: undefined,
        role_tag: undefined,
        ttl: undefined,
        max_ttl: undefined,
        period: undefined,
        policies: [],
        allow_instance_migration: undefined,
        disallow_reauthentication: false
    }

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/aws-ec2/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            ec2Roles: [],
            filteredEc2RoleList: [],
            configObj: this.ec2ConfigSchema,
            newConfigObj: this.ec2ConfigSchema,
            newRoleConfig: this.roleConfigSchema,
            selectedRoleId: '',
            newRoleId: '',
            newSecretBtnDisabled: false,
            openNewRoleDialog: false,
            openEditRoleDialog: false,
            deleteUserPath: '',
            selectedTab: 'roles',
            isBackendConfigured: false
        };

        _.bindAll(
            this,
            'listEc2Roles',
            'getEc2AuthConfig',
            'createUpdateConfig',
            'createUpdateRole'
        );

    }

    listEc2Roles() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/role`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role`, { list: true }, null)
                    .then((resp) => {
                        let roles = _.get(resp, 'data.data.keys', []);
                        this.setState({ ec2Roles: _.valuesIn(roles), filteredEc2RoleList: _.valuesIn(roles) });
                    })
                    .catch((error) => {
                        if (error.response.status !== 404) {
                            snackBarMessage(error);
                        } else {
                            this.setState({ ec2Roles: [], filteredEc2RoleList: [] });
                        }
                    });
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    getEc2AuthConfig() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/config/client`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/config/client`, null, null)
                    .then((resp) => {
                        let config = _.get(resp, 'data.data', this.ec2ConfigSchema);
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
        tokenHasCapabilities(['update'], `${this.state.baseVaultPath}/config/client`)
            .then(() => {
                callVaultApi('post', `${this.state.baseVaultPath}/config/client`, null, this.state.newConfigObj)
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
                        this.listEc2Roles();
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
        this.listEc2Roles();
        this.getEc2AuthConfig();
        let uri = this.props.location.pathname.split(this.state.baseUrl)[1];
        if (uri.includes('roles/') && uri.split('roles/')[1]) {
            this.setState({ selectedRoleId: uri.split('roles/')[1] });
            this.displayRole();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedRoleId != prevState.selectedRoleId) {
            this.listEc2Roles();
            if (this.state.selectedRoleId) {
                this.displayRole();
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/aws-ec2/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                ec2Roles: [],
                filteredEc2RoleList: [],
                selectedRoleId: '',
                newConfigObj: this.ec2ConfigSchema,
                configObj: this.ec2ConfigSchema,
                selectedTab: 'roles'
            }, () => {
                this.listEc2Roles();
                this.getEc2AuthConfig();
            });
        }
    }

    render() {
        let renderRoleListItems = () => {
            return _.map(this.state.filteredEc2RoleList, (role) => {
                let avatar = (<Avatar icon={<ActionAccountBox />} />);
                let action = (
                    <IconButton
                        tooltip='Delete'
                        onTouchTap={() => this.setState({ deleteUserPath: `${this.state.baseVaultPath}/role/${role}` })}
                    >
                        {window.localStorage.getItem('showDeleteModal') === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                    </IconButton>
                );

                let item = (
                    <ListItem
                        key={role}
                        primaryText={role}
                        insetChildren={true}
                        leftAvatar={avatar}
                        rightIconButton={action}
                        onTouchTap={() => {
                            tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${role}`)
                                .then(() => {
                                    this.setState({ selectedRoleId: role });
                                    history.push(`${this.state.baseUrl}roles/${role}`);
                                }).catch(() => {
                                    snackBarMessage(new Error('Access denied'));
                                })

                        }}
                    />
                )
                return item;
            });
        }

        let renderNewRoleDialog = () => {
            let validateAndSubmit = () => {
                if (this.state.newRoleId === '') {
                    snackBarMessage(new Error('Role name cannot be empty'));
                    return;
                }

                if (_.indexOf(this.state.ec2Roles, this.state.newRoleId) > 0) {
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
                    title={`Register EC2 role`}
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
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='AMI ID'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_ami_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='IAM Role ARN'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_iam_role_arn: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Account ID'
                            value={this.state.newRoleConfig.bound_account_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_account_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Region'
                            value={this.state.newRoleConfig.bound_region}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_region: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='VPC ID'
                            value={this.state.newRoleConfig.bound_vpc_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_vpc_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Subnet ID'
                            value={this.state.newRoleConfig.bound_subnet_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_subnet_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='IAM Instance Profile ARN'
                            value={this.state.newRoleConfig.bound_iam_instance_profile_arn}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_iam_instance_profile_arn: { $set: e.target.value } }) });
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
                        <ListItem primaryText='Disallow Reauthentication'>
                            <Toggle
                                toggled={this.state.newRoleConfig.disallow_reauthentication}
                                onToggle={(e, v) => {
                                    this.setState({ newRoleConfig: update(this.state.newRoleConfig, { disallow_reauthentication: { $set: v } }) });
                                }}
                            />
                        </ListItem>
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
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
                            floatingLabelText='AMI ID'
                            value={this.state.newRoleConfig.bound_ami_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_ami_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='IAM Role ARN'
                            value={this.state.newRoleConfig.bound_iam_role_arn}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_iam_role_arn: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Account ID'
                            value={this.state.newRoleConfig.bound_account_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_account_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Region'
                            value={this.state.newRoleConfig.bound_region}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_region: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='VPC ID'
                            value={this.state.newRoleConfig.bound_vpc_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_vpc_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Subnet ID'
                            value={this.state.newRoleConfig.bound_subnet_id}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_subnet_id: { $set: e.target.value } }) });
                            }}
                        />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='IAM Instance Profile ARN'
                            value={this.state.newRoleConfig.bound_iam_instance_profile_arn}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_iam_instance_profile_arn: { $set: e.target.value } }) });
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
                        <ListItem primaryText='Disallow Reauthentication'>
                            <Toggle
                                toggled={this.state.newRoleConfig.disallow_reauthentication}
                                onToggle={(e, v) => {
                                    this.setState({ newRoleConfig: update(this.state.newRoleConfig, { disallow_reauthentication: { $set: v } }) });
                                }}
                            />
                        </ListItem>
                        <Subheader>Assigned Policies</Subheader>
                        <PolicyPicker
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
                <VaultObjectDeleter
                    path={this.state.deleteUserPath}
                    onReceiveResponse={() => {
                        snackBarMessage(`Object '${this.state.deleteUserPath}' deleted`)
                        this.setState({ deleteUserPath: '' })
                        this.listEc2Roles();
                    }}
                    onReceiveError={(err) => snackBarMessage(err)}
                />
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
                            Here you can configure EC2 roles.
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
                                <ToolbarGroup lastChild={true}>
                                    <TextField
                                        floatingLabelFixed={true}
                                        floatingLabelText="Filter"
                                        hintText="Filter list items"
                                        onChange={(e, v) => {
                                            let filtered = _.filter(this.state.ec2Roles, (item) => {
                                                return item.toLowerCase().includes(v.toLowerCase());
                                            });
                                            if (filtered.length > 0)
                                                this.setState({
                                                    filteredEc2RoleList: filtered
                                                });
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <List className={sharedStyles.listStyle}>
                                {renderRoleListItems()}
                            </List>
                        </Paper>
                    </Tab>
                    <Tab
                        label='Configure Backend'
                        value='backend'
                        onActive={() => this.setState({ selectedTab: 'backend' })}
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure connection details to your EC2 account.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText='AKIAIOSFODNN7EXAMPLE'
                                    floatingLabelText='AWS Access Key ID'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.access_key}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { access_key: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                                    floatingLabelText='AWS Secret Access Key'
                                    fullWidth={true}
                                    type='password'
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.secret_key}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { secret_key: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText='Override with caution'
                                    floatingLabelText='Endpoint for making AWS EC2 API calls'
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.endpoint}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { endpoint: { $set: e.target.value } }) });
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