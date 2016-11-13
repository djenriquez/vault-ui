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
import Checkbox from 'material-ui/Checkbox';

export default class Github extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            requestOrganization: false,
            organization: window.localStorage.getItem('githubOrganization') || '',
            teamName: '',
            policies: [],
            checkedPolicy: '',
            submitBtnColor: 'lightgrey',
            submitBtnDisabled: true,
            errorMessage: '',
            selected: props.selected === 'Github'
        };

        _.bindAll(
            this,
            'listPolicies',
            'renderPolicies',
            'policyChecked',
            'teamNameChanged',
            'submitGithubPolicy',
            'requestOrganization',
            'renderOrganizationDialog'
        );

    }

    componentWillMount() {
        this.requestOrganization();
        this.listPolicies();
    }

    requestOrganization() {
        this.setState({
            requestOrganization: this.state.organization ? false : true
        })
    }

    renderOrganizationDialog() {
        const actions = [
            <div>
                <FlatButton label="Close" primary={true} onTouchTap={(e) => closeDialog(e)} />
                <FlatButton label="Submit" secondary={true} onTouchTap={(e) => submitOrg(e)} />
            </div>
        ];

        let submitOrg = (e) => {
            console.log('Submit clicked!');
            window.localStorage.setItem('githubOrganization', this.state.tmpOrganization)
            this.setState({
                organization: this.state.tmpOrganization,
                requestOrganization: false
            });
        };

        let closeDialog = (e) => {
            console.log('Close clicked!');
            this.setState({
                requestOrganization: false
            });
        };

        return (
            <Dialog
                title="Organization"
                actions={actions}
                modal={true}
                open={this.state.requestOrganization}
                >
                <TextField
                    id="organization"
                    fullWidth={true}
                    className="col-xs-12"
                    defaultValue={this.state.organization}
                    onChange={(e, v) => this.setState({ tmpOrganization: v })}
                    />
                <div className={styles.error}>{this.state.errorMessage}</div>
            </Dialog>
        )
    }

    listPolicies() {
        axios.get(`/listpolicies?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                let policies = _.map(resp.data.policies, (policy) => {
                    return {
                        name: policy,
                        checked: false
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

    teamNameChanged(e, v) {
        this.setState({
            teamName: v,
            submitBtnDisabled: !(this.state.checkedPolicy && this.state.organization && v),
            submitBtnColor: (this.state.checkedPolicy && this.state.organization && v) ? green500 : 'lightgrey'
        });
    }

    policyChecked(policyName, e, isChecked) {
        let policies = this.state.policies;
        _.forEach(policies, (policy) => {
            policy.checked = false;
        });

        let policyToCheck = _.find(policies, (policyToCheck) => { return policyToCheck.name == policyName; });
        policyToCheck.checked = isChecked;

        this.setState({
            policies: policies,
            checkedPolicy: isChecked ? policyToCheck.name : '',
            submitBtnDisabled: !(isChecked && this.state.organization && this.state.teamName),
            submitBtnColor: (isChecked && this.state.organization && this.state.teamName) ? green500 : 'lightgrey'
        });

    }

    renderPolicies() {
        return _.map(this.state.policies, (policy) => {
            return (
                <ListItem
                    leftCheckbox={<Checkbox
                        onCheck={(e, v) => this.policyChecked(policy.name, e, v)}
                        checked={policy.checked}
                        />}
                    style={{ marginLeft: -17 }}
                    key={policy.name}
                    primaryText={<div className={policy.name}>{policy.name}</div>}
                    >
                </ListItem>
            );
        });
    }


    submitGithubPolicy() {

    }

    render() {
        return (
            <div>
                <h2>Github</h2>
                {this.renderOrganizationDialog()}
                <p>Here you can view, update, and delete policies assigned to teams in your Github org.</p>
                <div className="row middle-xs" key="org">
                    <p>Current Organization: <span className={styles.orgName}>{<FlatButton label={this.state.organization.toUpperCase()} primary={true} onTouchTap={() => this.setState({ requestOrganization: true })} />}</span></p>
                    
                </div>
                <TextField
                    fullWidth={false}
                    className="col-xs-12"
                    hintText="Team Name"
                    onChange={this.teamNameChanged}
                    />
                {this.renderPolicies()}
                {this.state.policies.length > 0 && <FlatButton
                    label="Apply"
                    backgroundColor={this.state.submitBtnColor}
                    hoverColor={green400}
                    disabled={this.state.submitBtnDisabled}
                    labelStyle={{ color: white }}
                    onTouchTap={() => this.submitGithubPolicy()} />}
            </div>
        );
    }
}
