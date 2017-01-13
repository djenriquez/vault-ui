import axios from 'axios';
import React, { PropTypes } from 'react'
import _ from 'lodash';
import styles from './policies.css';
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

export default class Manage extends React.Component {
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
            errorMessage: '',
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

    updatePolicy(policyName, isNewPolicy) {

        axios.put(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "Policy": this.state.currentPolicy })
            .then((resp) => {
                if (isNewPolicy) {
                    let policies = this.state.policies;
                    policies.push({ name: policyName });
                    this.setState({
                        policies: policies
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
                if(err.response.data.errors){
                    this.setState({
                        errorMessage: err.response.data.errors.join('<br />')
                    });
                }
            })
        this.setState({ openNewPolicyModal: false });
        this.setState({ openEditModal: false });
    }

    listPolicies() {
        axios.get(`/listpolicies?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                let policies = _.map(resp.data.policies, (policy) => {
                    return {
                        name: policy
                    }
                });

                this.setState({
                    policies: policies,
                    errorMessage: '',
                    buttonColor: green500
                });
            })
            .catch((err) => {
                console.error(err.response.data);
                this.setState({
                    errorMessage: err.response.data,
                    forbidden: true,
                    buttonColor: 'lightgrey'
                });
            });
    }

    policyChangeSetState(v, syntaxCheckOk, schemaCheckOk) {
        if (syntaxCheckOk && schemaCheckOk && v) {
            this.setState({disableSubmit: false, currentPolicy: v});
        } else {
            this.setState({disableSubmit: true});
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
                this.setState({
                    newPolicyErrorMessage: MISSING_POLICY_ERROR
                });
                return;
            }

            if (_.filter(this.state.policies, x => x.name === this.state.focusPolicy).length > 0) {
                this.setState({
                    newPolicyErrorMessage: DUPLICATE_POLICY_ERROR
                });
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
                this.setState({newPolicyNameErrorMessage: '', focusPolicy: v});
            } else {
                this.setState({newPolicyNameErrorMessage: 'Policy name contains illegal characters'});
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

    clickPolicy(policyName) {
        axios.get(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                let rules = resp.data.data.rules;
                let rules_obj;
                // Attempt to parse into JSON incase a stringified JSON was sent
                try {
                    rules_obj = JSON.parse(rules);
                } catch (e) { }

                if (!rules_obj) {
                    // Previous parse failed, attempt HCL to JSON conversion
                    rules_obj = hcltojson(rules);
                }

                if(rules_obj) {
                    this.setState({
                        openEditModal: true,
                        focusPolicy: policyName,
                        currentPolicy: rules_obj,
                        disableSubmit: true,
                        errorMessage: '',
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
            });
    }

    deletePolicy(policyName) {
        axios.delete(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                if (resp.status !== 204) {
                    console.error(resp.status);
                    this.setState({
                        errorMessage: 'An error occurred.'
                    });
                } else {
                    let policies = this.state.policies;
                    let policyToDelete = _.find(policies, (policyToDelete) => { return policyToDelete.name === policyName });
                    policies = _.pull(policies, policyToDelete);
                    this.setState({
                        policies: policies,
                        errorMessage: ''
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
                this.setState({
                    errorMessage: err.response.data
                });
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
                <FontIcon className="fa fa-times-circle" color={red500} />
            </IconButton>);
    }

    renderPolicies() {
        return _.map(this.state.policies, (policy) => {
            return (
                <ListItem
                    style={{ marginLeft: -17 }}
                    key={policy.name}
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
                <h2>Manage Policies</h2>
                <p>Here you can view, update, and delete policies stored in your Vault.  Just remember, <span className={styles.error}>deleting policies cannot be undone!</span></p>
                {<FlatButton
                    label="Add Policy"
                    disabled={this.state.forbidden}
                    backgroundColor={this.state.buttonColor}
                    hoverColor={green400}
                    labelStyle={{ color: white }}
                    onTouchTap={() => this.setState({
                        openNewPolicyModal: true,
                        errorMessage: '',
                        newPolicyErrorMessage: '',
                        newPolicyNameErrorMessage: '',
                        disableSubmit: true,
                        focusPolicy: '',
                        currentPolicy: { path: { 'sample/path' : { capabilities: ['read'] }} }
                    })} />}
                {this.state.errorMessage &&
                    <div className={styles.error}>
                        <FontIcon className="fa fa-exclamation-triangle" color={red500} style={{ marginRight: 10 }} />
                        {this.state.errorMessage}
                    </div>
                }
                <List>
                    {this.renderPolicies()}
                </List>
            </div>
        );
    }
}
