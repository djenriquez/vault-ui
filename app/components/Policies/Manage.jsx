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

export default class Manage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openEditModal: false,
            openNewPolicyModal: false,
            newPolicyErrorMessage: '',
            openDeleteModal: false,
            editingPolicy: -1,
            deletingPolicy: '',
            policies: [],
            currentPolicy: '',
            errorMessage: '',
            forbidden: false,
            buttonColor: 'lightgrey'
        };

        _.bindAll(
            this,
            'updatePolicy',
            'listPolicies',
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

    updatePolicy() {
        let policyName = this.state.editingPolicy;

        axios.put(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "Policy": this.state.currentPolicy })
            .then((resp) => {
                // Custom future logic on success
                this.setState({
                    errorMessage: ''
                });
            })
            .catch((err) => {
                console.error(err.stack);
                this.setState({
                    errorMessage: err.response.data
                });
            })

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

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openEditModal: false })} />,
            <FlatButton label="Submit" primary={true} onTouchTap={() => this.updatePolicy()} />
        ];

        let policyChanged = (e, v, ) => {
            this.state.currentPolicy = e.target.value;
        };

        return (
            <Dialog
                title={`Editing ${this.state.editingPolicy}`}
                modal={false}
                actions={actions}
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({ openEditModal: false })}
                autoScrollBodyContent={true}
                >
                <TextField
                    style={{ height: '5000px' }}
                    onChange={(e, v) => policyChanged(e, v)}
                    name="editingText" multiLine={true}
                    autoFocus
                    defaultValue={this.state.currentPolicy}
                    fullWidth={true} />
            </Dialog>
        );
    }

    renderNewPolicyDialog() {
        const MISSING_POLICY_ERROR = "Policy cannot be empty.";
        const DUPLICATE_POLICY_ERROR = `Policy ${this.state.newPolicy.name} already exists.`;

        let validateAndSubmit = () => {
            if (this.state.newPolicy.name === '') {
                this.setState({
                    newPolicyErrorMessage: MISSING_POLICY_ERROR
                });
                return;
            }

            if (_.filter(this.state.policies, x => x.name === this.state.newPolicy.name).length > 0) {
                this.setState({
                    newPolicyErrorMessage: DUPLICATE_POLICY_ERROR
                });
                return;
            }

            axios.put(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(this.state.newPolicy.name)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "Policy": this.state.currentPolicy })
                .then((resp) => {
                    let policies = this.state.policies;
                    policies.push({ name: this.state.newPolicy.name });
                    this.setState({
                        policies: policies,
                        errorMessage: ''
                    });
                })
                .catch((err) => {
                    console.error(err.stack);
                    this.setState({
                        errorMessage: err.response.data
                    });
                })

            this.setState({ openNewPolicyModal: false });
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openNewPolicyModal: false, newPolicyErrorMessage: '' })} />,
            <FlatButton label="Submit" primary={true} onTouchTap={validateAndSubmit} />
        ];

        let setNewPolicy = (e, v) => {
            let currentPolicy = this.state.newPolicy;
            if (e.target.name === "newName") {
                currentPolicy.name = v;
            } else if (e.target.name === "newRules") {
                currentPolicy.rules = v;
            }
            this.setState({
                newPolicy: currentPolicy
            });
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
                <TextField name="newName" autoFocus fullWidth={true} hintText="Name" onChange={(e, v) => setNewPolicy(e, v)} />
                <TextField
                    name="newRules"
                    multiLine={true}
                    style={{ height: '5000px' }}
                    fullWidth={true}
                    hintText="Rules"
                    onChange={(e, v) => setNewPolicy(e, v)} />
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
                // Attempt to parse into JSON incase a stringified JSON was sent
                try {
                    rules = JSON.parse(rules)
                } catch (e) { }

                let val = typeof rules == 'object' ? JSON.stringify(rules, null, 4) : rules;

                this.setState({
                    openEditModal: true,
                    editingPolicy: policyName,
                    currentPolicy: val
                });
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
                    let policyToDelete = _.find(policies, (policyToDelete) => { return policyToDelete.name === policyName }); å
                    policies = _.pull(policies, policyToDelete);
                    this.setState({
                        secrets: policies,
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
                    onTouchTap={() => this.setState({ openNewPolicyModal: true, newPolicy: { name: '', value: '' } })} />}
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
