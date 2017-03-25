import React, { PropTypes } from 'react'
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
// Styles
import styles from './okta.css';
import sharedStyles from '../../shared/styles.css';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js'
import Checkbox from 'material-ui/Checkbox';
import { callVaultApi } from '../../shared/VaultUtils.jsx'
// Misc
import _ from 'lodash';
import update from 'immutability-helper';
import PolicyPicker from '../../shared/PolicyPicker/PolicyPicker.jsx'


export default class OktaAuthBackend extends React.Component {

    oktaUserSchema = {
        name: '',
        groups: [
            'default'
        ]
    };

    oktaConfigSchema = {
        organization: '',
        token: '',
        oktaUrl: 'okta.com'
    };


    constructor(props) {
        super(props);
        this.state = {
            userList: [],
            openNewUserDialog: false,
            newUserObject: this.oktaUserSchema,
            deleteUserPath: '',
            configObj: this.oktaConfigSchema,
            newConfigObj: this.oktaConfigSchema,
        };

        _.bindAll(
            this,
            'createUpdateUser',
            'createUpdateConfig'
        );

    }

    createUpdateUser(newUserObj, create=false) {
        return;
    }

    createUpdateConfig(newConfigObj, create=false) {
        return;
    }

    render() {
        let renderNewUserDialog = () => {
            let validateAndSubmit = () => {
                if (this.state.newUserObject.name === '') {
                    snackBarMessage(new Error("User Name cannot be empty"));
                    return;
                }

                if (!_.every(this.state.userList, (k) => { return k.id != this.state.newUserObject.name })) {
                    snackBarMessage(new Error("User already exists"));
                    return;
                }

                this.createUpdateUser(this.state.newUserObject, true);
                this.setState({ openNewUserDialog: false, newUserObject: _.clone(this.oktaUserSchema) });
            }

            const actions = [
                <FlatButton
                    label="Cancel"
                    onTouchTap={() => {
                        this.setState({ openNewUserDialog: false, newUserObject: _.clone(this.oktaUserSchema) })
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
                    title={`Register new Okta user`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewUserDialog}
                    onRequestClose={() => this.setState({ openNewUserDialog: false, newUserObject: _.clone(this.oktaUserSchema) })}
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
                                this.setState({ newUserObject: update(this.state.newUserObject, { name: { $set: e.target.value } }) });
                            }}
                        />
                        <Subheader>Assigned Groups</Subheader>
                    </List>
                </Dialog>
            );
        }

        let renderUserListItems = () => {
            return _.map(this.state.userList, (userobj) => {
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
                            this.setState({ newUserObject: _.clone(this.oktaUserSchema) });
                            tokenHasCapabilities(['read'], userobj.path).then(() => {
                                this.setState({ selectedUserId: userobj.id });
                                browserHistory.push(`${this.state.baseUrl}${userobj.id}`);
                            }).catch(() => {
                                snackBarMessage(new Error("Access denied"));
                            })

                        }}
                    />
                )
                return item;
            });
        }

        return (
            <div>
                {this.state.openNewUserDialog && renderNewUserDialog()}
                <Tabs>
                    <Tab label="Manage Users" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can add, edit or delete users registered with this backend
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label="NEW USER"
                                        //disabled={this.state.newSecretBtnDisabled}
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewUserDialog: true,
                                                newUserObject: _.clone(this.oktaUserSchema)
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <List className={sharedStyles.listStyle}>
                                {renderUserListItems()}
                            </List>
                        </Paper>
                    </Tab>
                    <Tab label="Manage Groups" >
                    </Tab>
                    <Tab label="Configure Backend" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure connection details to your Okta account.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <List>
                                <TextField
                                    hintText="Enter your Okta organization name"
                                    floatingLabelText="Okta organization"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.organization}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { organization: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter your Okta API token"
                                    floatingLabelText="Okta API token"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.token}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { token: { $set: e.target.value } }) });
                                    }}
                                />
                                <TextField
                                    hintText="Enter the Okta base url"
                                    floatingLabelText="Okta url"
                                    fullWidth={true}
                                    floatingLabelFixed={true}
                                    value={this.state.newConfigObj.oktaUrl}
                                    onChange={(e) => {
                                        this.setState({ newConfigObj: update(this.state.newConfigObj, { oktaUrl: { $set: e.target.value } }) });
                                    }}
                                />
                                <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                                    <FlatButton
                                        primary={true}
                                        label="Save"
                                        onTouchTap={() => this.createUpdateConfig(this.state.newConfigObj)}
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