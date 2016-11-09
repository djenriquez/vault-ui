import axios from 'axios';
import React, { PropTypes } from 'react'
import _ from 'lodash';
import styles from './policies.css';
import FlatButton from 'material-ui/FlatButton';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js'
import { List, ListItem } from 'material-ui/List';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';

export default class Policy extends React.Component {
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
            currentPolicy: ''
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
            'policyChanged'
        )
    }

    componentWillMount() {
        this.listPolicies();
    }

    updatePolicy() {
        let policyName = `${this.state.editingPolicy}`;

        axios.put(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "Policy": this.state.currentPolicy })
            .then((resp) => {
                if (resp.status === 200) {

                } else {
                    // errored
                }

            })
            .catch((err) => {
                console.error(err.stack);
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
                    policies: policies
                })
            })
            .catch((err) => {
                console.error(err);
            });
    }

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openEditModal: false })} />,
            <FlatButton label="Submit" primary={true} onTouchTap={() => this.updatePolicy()} />
        ];

        return (
            <Dialog
                title={`Editing ${this.state.editingPolicy}`}
                modal={false}
                actions={actions}
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({ openEditModal: false })}
                autoScrollBodyContent={true}
                >
                <TextField style={{ height: '5000px' }} onChange={this.policyChanged} name="editingText" multiLine={true} autoFocus defaultValue={this.state.currentPolicy} fullWidth={true} />
            </Dialog>
        );
    }

    policyChanged(e) {
        this.state.currentPolicy = e.target.value;
    }

    renderNewPolicyDialog() {

    }

    renderDeleteConfirmationDialog() {

    }

    clickPolicy(policyName) {
        axios.get(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(policyName)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                let rules = resp.data.data.rules;
                // Attempt to parse into JSON incase a stringified JSON was sent
                try {
                    rules = JSON.parse(rules)
                } catch (e) { }

                let val = typeof rules == 'object' ? JSON.stringify(rules, null, 2) : rules;

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

    showDelete(policyName) {

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
                <h1 id={styles.welcomeHeadline}>Policies</h1>
                <p>Here you can view, update, and delete policies stored in your Vault.  Just remember, <span className={styles.error}>deleting policies cannot be undone!</span></p>
                <FlatButton
                    label="Add Key"
                    backgroundColor={green500}
                    hoverColor={green400}
                    labelStyle={{ color: white }}
                    onTouchTap={() => this.setState({ openNewKeyModal: true, newKey: { key: '', value: '' } })} />
                <List>
                    {this.renderPolicies()}
                </List>
            </div>
        );
    }
}
