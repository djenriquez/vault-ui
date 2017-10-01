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
import styles from './userpass.css';
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

export default class UserPassAuthBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    userPassConfigSchema = {
        id: undefined,
        max_ttl: undefined,
        ttl: undefined,
        policies: undefined
    };

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: `/auth/userpass/${this.props.params.namespace}/`,
            baseVaultPath: `auth/${this.props.params.namespace}`,
            users: [],
            config: this.userPassConfigSchema,
            selectedUserId: '',
            newUserId: '',
            newUserPassword: '',
            newUserPassword2: '',
            openItemDialog: false,
            openNewItemDialog: false,
        }
    }

    listUsers() {
        tokenHasCapabilities(['list'], `${this.state.baseVaultPath}/users`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/users`, { list: true }, null)
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

    displayItem() {
        tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/users/${this.state.selectedUserId}`)
            .then(() => {
                callVaultApi('get', `${this.state.baseVaultPath}/users/${this.state.selectedUserId}`, null, null)
                    .then((resp) => {
                        let user = _.get(resp, 'data.data', {});

                        let policies = _.get(user, 'policies', undefined);

                        this.setState({ config: user, openItemDialog: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                snackBarMessage(new Error('Access denied'));
            })
    }

    createUpdateUser(user, newUser = null) {
        tokenHasCapabilities(['create', 'update'], `${this.state.baseVaultPath}/users/${user}`)
            .then(() => {
                let updateObj = _.clone(this.state.config);
                if (newUser) updateObj.password = this.state.newUserPassword;
                updateObj.policies = updateObj.policies.join(',');
                callVaultApi('post', `${this.state.baseVaultPath}/users/${user}`, null, updateObj)
                    .then(() => {
                        snackBarMessage(`User ${user} has been updated`);
                        this.listUsers();
                        this.setState({ openNewItemDialog: false, openItemDialog: false, config: _.clone(this.userPassConfigSchema), selectedUserId: '', newUserId: '' });
                        history.push(`${this.state.baseUrl}users/`);
                    })
                    .catch(snackBarMessage);
            })
            .catch(() => {
                this.setState({ selectedRoleId: '' })
                snackBarMessage(new Error(`No permissions to display properties for role ${user}`));
            });
    }

    componentDidMount() {
        this.listUsers();
        let user = this.props.location.pathname.split(this.state.baseUrl)[1];
        if (user) {
            this.setState({ selectedUserId: user });
            this.displayItem();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedUserId != prevState.selectedUserId) {
            this.listUsers();
            if (this.state.selectedUserId) {
                this.displayItem();
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                baseUrl: `/auth/userpass/${nextProps.params.namespace}/`,
                baseVaultPath: `auth/${nextProps.params.namespace}`,
                users: [],
                config: this.userPassConfigSchema,
                selectedUserId: '',
                newUserId: '',
                openItemDialog: false,
                openNewItemDialog: false,
            }, () => {
                this.listUsers();
            });
        }
    }

    render() {
        let renderPolicyDialog = () => {
            const actions = [
                <FlatButton
                    label='Cancel'
                    onTouchTap={() => {
                        this.setState({ openItemDialog: false, selectedUserId: '' });
                        history.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    onTouchTap={() => {
                        this.createUpdateUser(this.state.selectedUserId);
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Editing User '${this.state.selectedUserId}'`}
                    modal={false}
                    actions={actions}
                    open={this.state.openItemDialog}
                    onRequestClose={() => {
                        this.setState({ openItemDialog: false, selectedUserId: '' });
                        history.push(this.state.baseUrl);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <Subheader>Assigned Policies</Subheader>
                        <ItemPicker
                            height='250px'
                            selectedPolicies={this.state.config.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ config: update(this.state.config, { policies: { $set: newPolicies } }) });
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
                        this.setState({ openNewItemDialog: false, newUserId: '' });
                        history.push(this.state.baseUrl);
                    }}
                />,
                <FlatButton
                    label='Save'
                    primary={true}
                    disabled={!(this.state.newUserPassword === this.state.newUserPassword2)}
                    onTouchTap={() => {
                        this.createUpdateUser(`${this.state.newUserId}`, true);
                    }}
                />
            ];

            return (
                <Dialog
                    title={`Adding new user`}
                    modal={false}
                    actions={actions}
                    open={this.state.openNewItemDialog}
                    onRequestClose={() => {
                        this.setState({ openNewItemDialog: false, newUserId: '' });
                        history.push(this.state.baseUrl);
                    }}
                    autoScrollBodyContent={true}
                >
                    <List>
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Enter user name'
                            floatingLabelFixed={true}
                            floatingLabelText='Name'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newUserId: e.target.value });
                            }}
                        /><br />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Enter password'
                            floatingLabelFixed={true}
                            floatingLabelText='Password'
                            type='password'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newUserPassword: e.target.value });
                            }}
                        /><br />
                        <TextField
                            className={styles.textFieldStyle}
                            hintText='Re-enter password'
                            floatingLabelFixed={true}
                            floatingLabelText='Password'
                            type='password'
                            fullWidth={false}
                            autoFocus
                            onChange={(e) => {
                                this.setState({ newUserPassword2: e.target.value });
                            }}
                        /><br />
                        <Subheader>Assigned Policies</Subheader>
                        <ItemPicker
                            height='250px'
                            selectedPolicies={this.state.config.policies}
                            onSelectedChange={(newPolicies) => {
                                this.setState({ config: update(this.state.config, { policies: { $set: newPolicies } }) });
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
                <Tabs>
                    <Tab
                        label='Manage Users'
                        value='users'
                    >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can configure Users.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label='NEW USER'
                                        onTouchTap={() => {
                                            this.setState({
                                                newUserId: '',
                                                openNewItemDialog: true,
                                                config: _.clone(this.userPassConfigSchema)
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <ItemList
                                itemList={this.state.users}
                                itemUri={`${this.state.baseVaultPath}/users`}
                                maxItemsPerPage={25}
                                onDeleteTap={(deletedItem) => {
                                    snackBarMessage(`User '${deletedItem}' deleted`)
                                    this.listUsers();
                                }}
                                onTouchTap={(item) => {
                                    tokenHasCapabilities(['read'], `${this.state.baseVaultPath}/${item}`)
                                        .then(() => {
                                            this.setState({ selectedUserId: `${item}` });
                                            history.push(`${this.state.baseUrl}${item}`);
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