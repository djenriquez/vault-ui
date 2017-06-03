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
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
// Styles
import styles from './aws.css';
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

export default class AwsAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    ec2ConfigSchema = {
        access_key: '',
        endpoint: undefined,
        secret_key: ''
    };

    authTypes = [
        'ec2',
        'iam'
    ]

    inferredEntityTypes = [
        'none',
        'ec2_instance'
    ]

    roleConfigSchema = {
        bound_ami_id: undefined,
        bound_account_id: undefined,
        bound_region: undefined,
        bound_vpc_id: undefined,
        bound_subnet_id: undefined,
        bound_iam_role_arn: undefined,
        bound_iam_instance_profile_arn: undefined,
        role_tag: undefined,
        role_tag_value: undefined,
        ttl: undefined,
        max_ttl: undefined,
        period: undefined,
        policies: [],
        allow_instance_migration: undefined,
        disallow_reauthentication: undefined,
        auth_type: 'ec2',
        bound_iam_principal_arn: undefined,
        inferred_entity_type: undefined,
        inferred_entity_type_string: 'none',
        inferred_aws_region: undefined
    };

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/aws/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            ec2Roles: [],
            filteredEc2RoleList: [],
            configObj: this.ec2ConfigSchema,
            newConfigObj: this.ec2ConfigSchema,
            newRoleConfig: this.roleConfigSchema,
            selectedRoleId: '',
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
            'createUpdateRole',
            'parseRoleConfig'
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

    createUpdateRole() {
        let roleId = this.state.selectedRoleId;
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/role/${roleId}`)
            .then(() => {
                let updateObj = _.clone(this.state.newRoleConfig);
                updateObj.policies = updateObj.policies.join(',');

                // This field is not allowed for IAM types
                if (updateObj.auth_type === 'iam') {
                    updateObj.disallow_reauthentication = undefined;
                    updateObj.allow_instance_migration = undefined;
                }

                callVaultApi('post', `${this.state.baseVaultPath}/role/${roleId}`, null, updateObj)
                    .then(() => {
                        if (updateObj.role_tag && updateObj.role_tag_value) {
                            callVaultApi('post', `${this.state.baseVaultPath}/role/${roleId}/tag`, null, updateObj.role_tag_value)
                                .then(() => {
                                    snackBarMessage(`Role ${roleId} and role tag ${updateObj.role_tag}:${updateObj.role_tag_value} have been updated`);
                                });
                        }
                        else {
                            snackBarMessage(`Role ${roleId} has been updated`);
                        }
                        this.listEc2Roles();
                        this.setState({ openNewRoleDialog: false, openEditRoleDialog: false, newRoleConfig: _.clone(this.roleConfigSchema), selectedRoleId: '' });
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
        let roleId = this.state.selectedRoleId;
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/role/${roleId}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/role/${roleId}`, null, null)
                    .then((resp) => {
                        let roleConfig = this.parseRoleConfig(_.get(resp, 'data.data', {}));

                        this.setState({ newRoleConfig: roleConfig, openEditRoleDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to display properties for role ${this.state.selectedRoleId}`));
            })
    }

    // Parses the config received from Vault
    // Puts the object in a state readable by the UI and in a state that can be passed to the update/create method
    parseRoleConfig(roleConfig) {
        // Clear falsy values
        roleConfig = _.pickBy(roleConfig, _.identity);

        // Set string value for inferred entity type
        roleConfig.inferred_entity_type_string = roleConfig.inferred_entity_type ? roleConfig.inferred_entity_type : 'none';

        return roleConfig;
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
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedRoleId != prevState.selectedRoleId && !this.state.openNewRoleDialog) {
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
                baseUrl: `/auth/aws/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                ec2Roles: [],
                filteredEc2RoleList: [],
                selectedRoleId: '',
                newConfigObj: this.roleConfigSchema,
                configObj: this.ec2ConfigSchema,
                selectedTab: 'roles'
            }, () => {
                this.listEc2Roles();
                this.getEc2AuthConfig();
            });
        }
    }

    render() {
        
        let renderFields = () => {
            let renderAuthTypes = () => {
                return this.authTypes.map((authType) => (
                    <MenuItem
                        value={authType}
                        primaryText={authType}
                    />
                ));
            };

            let renderInferredEntityTypes = () => {
                return this.inferredEntityTypes.map((entityType) => (
                    <MenuItem
                        value={entityType}
                        primaryText={entityType}
                    />
                ));
            };

            let renderTopFields = () => {
                return (
                    [
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Enter the new role name'
                            floatingLabelFixed={true}
                            floatingLabelText='Role Name'
                            fullWidth={false}
                            value={this.state.selectedRoleId}
                            disabled={this.state.openEditRoleDialog}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ selectedRoleId: e.target.value });
                            }}
                        />,
                        <SelectField
                            floatingLabelText="Auth Type"
                            value={this.state.newRoleConfig.auth_type}
                            onChange={authTypeChanged}
                            disabled={this.state.openEditRoleDialog}
                        >
                            {renderAuthTypes()}
                        </SelectField>
                    ]
                )
            }

            let renderBottomFields = () => {
                return (
                    [
                        <Subheader>Assigned Policies</Subheader>,
                        <PolicyPicker
                            height='200px'
                            selectedPolicies={this.state.newRoleConfig.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { policies: { $set: newPolicies } }) });
                            }}
                        />
                    ]
                )
            }

            // Fields available only for IAM auth
            let renderIamFields = () => {
                return (
                    [
                        <SelectField
                            floatingLabelText="Inferred Entity Type"
                            value={this.state.newRoleConfig.inferred_entity_type_string}
                            onChange={(e, i, v) => {
                                this.setState({
                                    newRoleConfig: update(this.state.newRoleConfig, {
                                        inferred_entity_type: {
                                            $set: v === 'none' ? undefined : v
                                        },
                                        inferred_entity_type_string: {
                                            $set: v
                                        },
                                        inferred_aws_region: {
                                            $set: v === 'none' ? '' : this.state.inferred_aws_region
                                        }
                                    })
                                });
                            }}
                            disabled={this.state.openEditRoleDialog}
                        >
                            {renderInferredEntityTypes()}
                        </SelectField>,
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='arn:aws:iam::123456789012:role/MyRole'
                            floatingLabelFixed={true}
                            floatingLabelText='Bound IAM Principle ARN'
                            value={this.state.newRoleConfig.bound_iam_principal_arn}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { bound_iam_principal_arn: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            };

            // Fields available only for EC2 auth
            let renderEc2Fields = () => {
                return (
                    [
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='optional'
                            floatingLabelFixed={true}
                            floatingLabelText='Role Tag Key'
                            value={this.state.newRoleConfig.role_tag}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { role_tag: { $set: e.target.value ? e.target.value : undefined } }) });
                            }}
                        />,
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='overwrite current value'
                            floatingLabelFixed={true}
                            floatingLabelText='Role Tag Value'
                            value={this.state.newRoleConfig.role_tag_value}
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { role_tag_value: { $set: e.target.value } }) });
                            }}
                        />,
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
                        />,
                    ]
                )
            };

            // Fields available for IAM auth with ec2_instance inferred
            let renderEc2EntityTypeFields = () => {
                return (
                    [
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='us-east-1, us-west-2, eu-west-1'
                            floatingLabelFixed={true}
                            floatingLabelText='Inferred AWS Region'
                            value={this.state.newRoleConfig.inferred_aws_region}
                            fullWidth={false}
                            disabled={!this.state.newRoleConfig.inferred_entity_type}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { inferred_aws_region: { $set: e.target.value } }) });
                            }}
                        />
                    ]
                )
            }

            // Fields available for IAM auth with ec2_instance inferred and EC2 auth
            let renderInferredFields = () => {
                return (
                    [
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
                        />,
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
                        />,
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
                        />,
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
                        />,
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
                        />,
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
                    ]
                )
            }

            // Fields available for all AWS auth types
            let renderGlobalFields = () => {
                return (
                    [
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
                        />,
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
                    ]
                )
            }

            let authTypeChanged = (event, index, value) => {
                let auth_type = value;

                // Reset fields
                this.setState(
                    {
                        newRoleConfig: update(this.state.newRoleConfig,
                            {
                                auth_type: { $set: auth_type },
                                disallow_reauthentication: { $set: auth_type === 'ec2' ? this.state.disallow_reauthentication : undefined },
                                role_tag: { $set: auth_type === 'ec2' ? this.state.role_tag : undefined },
                                role_tag_value: { $set: auth_type === 'ec2' ? this.state.role_tag_value : undefined },
                                bound_iam_principal_arn: { $set: auth_type === 'iam' ? this.state.bound_iam_principal_arn : undefined },
                                inferred_entity_type: { $set: undefined },
                                inferred_entity_type_string: { $set: 'none' },
                                inferred_aws_region: { $set: auth_type === 'iam' ? this.state.inferred_aws_region : undefined }
                            }),

                    });
            };

            return (
                <List>
                    {renderTopFields()}
                    {this.state.newRoleConfig.auth_type === "iam" && renderIamFields()}
                    {this.state.newRoleConfig.auth_type === "iam" && this.state.newRoleConfig.inferred_entity_type && _.concat(renderInferredFields(), renderEc2EntityTypeFields())}
                    {this.state.newRoleConfig.auth_type === "ec2" && _.concat(renderEc2Fields(), renderInferredFields())}
                    {renderGlobalFields()}
                    {this.state.newRoleConfig.auth_type === "ec2" && <ListItem primaryText='Disallow Reauthentication'>
                        <Toggle
                            toggled={this.state.newRoleConfig.disallow_reauthentication}
                            onToggle={(e, v) => {
                                this.setState({ newRoleConfig: update(this.state.newRoleConfig, { disallow_reauthentication: { $set: v } }) });
                            }}
                        />
                    </ListItem>}
                    {renderBottomFields()}
                </List>
            )
        }

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
                if (this.state.selectedRoleId === '') {
                    snackBarMessage(new Error('Role name cannot be empty'));
                    return;
                }

                if (_.indexOf(this.state.ec2Roles, this.state.selectedRoleId) > 0) {
                    snackBarMessage(new Error('Role already exists'));
                    return;
                }

                this.createUpdateRole();
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
                    {renderFields()}
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
                        this.createUpdateRole()
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
                    {renderFields()}
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
                            Here you can configure AWS roles.
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
                            Here you can configure connection details to your AWS account.
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