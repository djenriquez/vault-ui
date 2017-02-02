import React, { PropTypes } from 'react'
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import styles from './policies.css';
import sharedStyles from '../shared/styles.css';
import FlatButton from 'material-ui/FlatButton';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js'
import { List, ListItem } from 'material-ui/List';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import JsonEditor from '../shared/JsonEditor.jsx';
import hcltojson from 'hcl-to-json'
import jsonschema from './vault-policy-schema.json'
import { callVaultApi } from '../shared/VaultUtils.jsx'
import Avatar from 'material-ui/Avatar';
import HardwareSecurity from 'material-ui/svg-icons/hardware/security';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import ActionDelete from 'material-ui/svg-icons/action/delete';

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class PolicyManager extends React.Component {
    constructor(props) {
        super(props);
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
            'listPolicies',
            'policyChangeSetState',
            'renderEditDialog',
            'renderNewPolicyDialog',
            'renderDeleteConfirmationDialog',
            'clickPolicy',
            'showDelete',
            'renderPolicies',
            'deletePolicy'
        )
    }

    componentWillMount() {
        this.listPolicies();
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
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openEditModal: false })} />,
            <FlatButton label="Submit" disabled={this.state.disableSubmit} primary={true} onTouchTap={() => this.updatePolicy(this.state.focusPolicy, false)} />
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

            if (_.filter(this.state.policies, x => x.name === this.state.focusPolicy).length > 0) {
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

    renderDeleteConfirmationDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openDeleteModal: false, deletingPolicy: '' })} />,
            <FlatButton label="Delete" style={{ color: white }} hoverColor={red300} backgroundColor={red500} primary={true} onTouchTap={() => this.deletePolicy(this.state.deletingPolicy)} />
        ];

        return (
            <Dialog
                title={`Delete Confirmation`}
                modal={false}
                actions={actions}
                open={this.state.openDeleteModal}
                onRequestClose={() => this.setState({ openDeleteModal: false, newPolicyErrorMessage: '' })}
                >

                <p>You are about to permanently delete {this.state.deletingPolicy}.  Are you sure?</p>
                <em>To disable this prompt, visit the settings page.</em>
            </Dialog>
        )
    }

    updatePolicy(policyName, isNewPolicy) {
        let stringifiedPolicy = JSON.stringify(this.state.currentPolicy);
        callVaultApi('put', `sys/policy/${encodeURI(policyName)}`, null, { rules: stringifiedPolicy }, null)
            .then((resp) => {
                if (isNewPolicy) {
                    let policies = this.state.policies;
                    policies.push({ name: policyName });
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
        callVaultApi('get', `sys/policy`, null, null, null)
            .then((resp) => {
                let policies = _.map(resp.data.policies, (policy) => {
                    return {
                        name: policy
                    }
                });

                this.setState({
                    policies: policies,
                    buttonColor: green500
                });
            })
            .catch((err) => {
                console.error(err.response.data);
                snackBarMessage(err);
            });
    }

    clickPolicy(policyName) {
        callVaultApi('get', `sys/policy/${encodeURI(policyName)}`, null, null, null)
            .then((resp) => {
                let rules = _.get(resp, 'data.data.rules', _.get(resp, 'data.rules', {}));
                let rules_obj;
                // Attempt to parse into JSON incase a stringified JSON was sent
                try {
                    rules_obj = JSON.parse(rules);
                } catch (e) { }

                if (!rules_obj) {
                    // Previous parse failed, attempt HCL to JSON conversion
                    rules_obj = hcltojson(rules);
                }

                if (rules_obj) {
                    this.setState({
                        openEditModal: true,
                        focusPolicy: policyName,
                        currentPolicy: rules_obj,
                        disableSubmit: true
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
            });
    }

    deletePolicy(policyName) {
        callVaultApi('delete', `sys/policy/${encodeURI(policyName)}`, null, null, null)
            .then((resp) => {
                let policies = this.state.policies;
                let policyToDelete = _.find(policies, (policyToDelete) => { return policyToDelete.name === policyName });
                policies = _.pull(policies, policyToDelete);
                this.setState({
                    policies: policies,
                });
                snackBarMessage(`Policy '${policyName}' deleted`);
            })
            .catch((err) => {
                console.error(err.stack);
                snackBarMessage(err);
            });

        this.setState({
            deletingPolicy: '',
            openDeleteModal: false
        });
    }

    showDelete(policyName) {
        return (
            <IconButton
                tooltip="Delete"
                onTouchTap={() => {
                    if (window.localStorage.getItem("showDeleteModal") === 'false') {
                        this.deletePolicy(policyName);
                    } else {
                        this.setState({ deletingPolicy: policyName, openDeleteModal: true })
                    }
                } }
                >
                { window.localStorage.getItem("showDeleteModal") === 'false' ? <ActionDeleteForever color={red500}/> : <ActionDelete color={red500}/>}
                
            </IconButton>);
    }

    renderPolicies() {
        return _.map(this.state.policies, (policy) => {
            return (
                <ListItem
                    key={policy.name}
                    leftAvatar={<Avatar icon={<HardwareSecurity />} />}
                    onTouchTap={() => { this.clickPolicy(policy.name) } }
                    primaryText={<div className={policy.name}>{policy.name}</div>}
                    rightIconButton={this.showDelete(policy.name)}>
                </ListItem>
            );
        });
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
                            <List className={sharedStyles.listStyle}>
                                {this.renderPolicies()}
                            </List>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
