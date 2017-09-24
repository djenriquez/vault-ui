import React, { PropTypes } from 'react'
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import styles from './policies.css';
import sharedStyles from '../shared/styles.css';
import FlatButton from 'material-ui/FlatButton';
import { green500, green400, red500, red300, white } from 'material-ui/styles/colors.js'
import { List, ListItem } from 'material-ui/List';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import JsonEditor from '../shared/JsonEditor.jsx';
import ghcl from 'gopher-hcl';
import jsonschema from './vault-policy-schema.json'
import { callVaultApi, tokenHasCapabilities, history } from '../shared/VaultUtils.jsx'
import Avatar from 'material-ui/Avatar';
import HardwareSecurity from 'material-ui/svg-icons/hardware/security';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import ActionDelete from 'material-ui/svg-icons/action/delete';

import ItemList from '../shared/ItemList/ItemList.jsx';

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class PolicyManager extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.baseUrl = `/sys/policies/`;
        this.baseVaultPath = `sys/policy`;

        this.state = {
            openEditModal: false,
            openNewPolicyModal: false,
            newPolicyErrorMessage: '',
            newPolicyNameErrorMessage: '',
            openDeleteModal: false,
            focusPolicy: -1,
            deletingPolicy: '',
            policies: [],
            currentPolicy: '',
            disableSubmit: false,
            forbidden: false,
            buttonColor: 'lightgrey'
        };

        _.bindAll(
            this,
            'updatePolicy',
            'displayPolicy',
            'listPolicies',
            'policyChangeSetState',
            'renderEditDialog',
            'renderNewPolicyDialog'
        )
    }

    componentDidMount() {
        if (this.props.params.splat) {
            this.displayPolicy();
        } else {
            this.listPolicies();
        }
    }

    componentDidUpdate(prevProps) {
        if (!_.isEqual(this.props.params, prevProps.params)) {
            if (this.props.params.splat) {
                this.displayPolicy();
            } else {
                this.listPolicies();
            }
        }
    }

    policyChangeSetState(v, syntaxCheckOk, schemaCheckOk) {
        if (syntaxCheckOk && schemaCheckOk && v) {
            this.setState({ disableSubmit: false, currentPolicy: v });
        } else {
            this.setState({ disableSubmit: true });
        }
    }

    renderEditDialog() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={() => {
                    this.setState({ openEditModal: false })
                    history.push(this.baseUrl);
                }}
            />,
            <FlatButton
                label="Submit"
                disabled={this.state.disableSubmit}
                primary={true}
                onTouchTap={() => {
                    this.updatePolicy(this.state.focusPolicy, false)
                    history.push(this.baseUrl);
                }}
            />
        ];

        return (
            <Dialog
                title={`Editing ${this.state.focusPolicy}`}
                modal={false}
                actions={actions}
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({ openEditModal: false })}
                autoScrollBodyContent={true}
            >
                <JsonEditor
                    height={'400px'}
                    rootName={this.state.focusPolicy}
                    value={this.state.currentPolicy}
                    mode={'code'}
                    schema={jsonschema}
                    onChange={this.policyChangeSetState}
                />
            </Dialog>
        );
    }

    renderNewPolicyDialog() {
        const MISSING_POLICY_ERROR = "Policy cannot be empty.";
        const DUPLICATE_POLICY_ERROR = `Policy ${this.state.focusPolicy} already exists.`;

        let validateAndSubmit = () => {
            if (this.state.focusPolicy === '') {
                snackBarMessage(new Error(MISSING_POLICY_ERROR));
                return;
            }

            if (_.filter(this.state.policies, x => x === this.state.focusPolicy).length > 0) {
                snackBarMessage(new Error(DUPLICATE_POLICY_ERROR));
                return;
            }
            this.updatePolicy(this.state.focusPolicy, true);
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openNewPolicyModal: false, newPolicyErrorMessage: '' })} />,
            <FlatButton label="Submit" disabled={this.state.disableSubmit} primary={true} onTouchTap={validateAndSubmit} />
        ];

        let validatePolicyName = (event, v) => {
            var pattern = /^[^\/&]+$/;
            v = v.toLowerCase();
            if (v.match(pattern)) {
                this.setState({ newPolicyNameErrorMessage: '', focusPolicy: v });
            } else {
                this.setState({ newPolicyNameErrorMessage: 'Policy name contains illegal characters' });
            }
        }


        return (
            <Dialog
                title={`New Policy`}
                modal={false}
                actions={actions}
                open={this.state.openNewPolicyModal}
                onRequestClose={() => this.setState({ openNewPolicyModal: false, newPolicyErrorMessage: '' })}
                autoScrollBodyContent={true}
                autoDetectWindowHeight={true}
            >
                <TextField
                    name="newName"
                    autoFocus
                    fullWidth={true}
                    hintText="Name"
                    errorText={this.state.newPolicyNameErrorMessage}
                    onChange={validatePolicyName}
                />
                <JsonEditor
                    height={'400px'}
                    rootName={this.state.focusPolicy || null}
                    value={this.state.currentPolicy}
                    mode={'code'}
                    schema={jsonschema}
                    onChange={this.policyChangeSetState}
                />
                <div className={styles.error}>{this.state.newPolicyErrorMessage}</div>
            </Dialog>
        );
    }

    updatePolicy(policyName, isNewPolicy) {
        let stringifiedPolicy = JSON.stringify(this.state.currentPolicy);
        callVaultApi('put', `${this.baseVaultPath}/${policyName}`, null, { rules: stringifiedPolicy }, null)
            .then(() => {
                if (isNewPolicy) {
                    let policies = this.state.policies;
                    policies.push(policyName);
                    this.setState({
                        policies: policies
                    });
                    snackBarMessage(`Policy '${policyName}' added`);
                } else {
                    snackBarMessage(`Policy '${policyName}' updated`);
                }
            })
            .catch((err) => {
                console.error(err.stack);
                snackBarMessage(err);
            })
        this.setState({ openNewPolicyModal: false });
        this.setState({ openEditModal: false });
    }

    listPolicies() {
        callVaultApi('get', this.baseVaultPath, null, null, null)
            .then((resp) => {
                this.setState({
                    policies: resp.data.policies,
                    buttonColor: green500
                });
            })
            .catch((err) => {
                console.error(err.response.data);
                snackBarMessage(err);
            });
    }

    displayPolicy() {
        callVaultApi('get', `${this.baseVaultPath}/${this.props.params.splat}`, null, null, null)
            .then((resp) => {
                let rules = _.get(resp, 'data.data.rules', _.get(resp, 'data.rules', {}));
                let rules_obj;
                // Attempt to parse into JSON incase a stringified JSON was sent
                try {
                    rules_obj = JSON.parse(rules);
                } 
                // Previous parse failed, attempt HCL to JSON conversion
                catch (e) { 
                    rules_obj = ghcl.parse(rules); 
                }

                if (rules_obj) {
                    this.setState({
                        openEditModal: true,
                        focusPolicy: this.props.params.splat,
                        currentPolicy: rules_obj,
                        disableSubmit: true
                    });
                }
            })
            .catch(snackBarMessage);
    }

    render() {
        return (
            <div>
                {this.state.openEditModal && this.renderEditDialog()}
                {this.state.openNewPolicyModal && this.renderNewPolicyDialog()}
                {this.state.openDeleteModal && this.renderDeleteConfirmationDialog()}
                <Tabs>
                    <Tab label="Manage Access Control Policies" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can view, update, and delete policies stored in your Vault.  Just remember, <span className={styles.error}>deleting policies cannot be undone!</span>
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        label="Add Policy"
                                        disabled={this.state.forbidden}
                                        backgroundColor={this.state.buttonColor}
                                        hoverColor={green400}
                                        labelStyle={{ color: white }}
                                        onTouchTap={() => this.setState({
                                            openNewPolicyModal: true,
                                            newPolicyErrorMessage: '',
                                            newPolicyNameErrorMessage: '',
                                            disableSubmit: true,
                                            focusPolicy: '',
                                            currentPolicy: { path: { 'sample/path': { capabilities: ['read'] } } }
                                        })}
                                    />
                                </ToolbarGroup>
                            </Toolbar>
                            <ItemList
                                itemList={this.state.policies}
                                itemUri={`${this.baseVaultPath}`}
                                maxItemsPerPage={25}
                                onDeleteTap={(deletedItem) => {
                                    snackBarMessage(`Object '${deletedItem}' deleted`)
                                    this.listPolicies();
                                }}
                                onTouchTap={(item) => {
                                    tokenHasCapabilities(['read'], `${this.baseVaultPath}/${item}`).then(() => {
                                        history.push(`${this.baseUrl}${item}`);
                                    }).catch(() => {
                                        snackBarMessage(new Error("Access denied"));
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
