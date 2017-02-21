import React, { PropTypes } from 'react'
import _ from 'lodash';
import styles from './github.css';
import FlatButton from 'material-ui/FlatButton';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js'
import { List, ListItem } from 'material-ui/List';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import sharedStyles from '../../shared/styles.css';
import Checkbox from 'material-ui/Checkbox';
import { callVaultApi } from '../../shared/VaultUtils.jsx'

export default class GithubAuthBackend extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            requestOrganization: false,
            organization: window.localStorage.getItem('githubOrganization') || '',
            teamName: '',
            policies: [],
            checkedPolicies: [],
            submitBtnColor: 'lightgrey',
            submitBtnDisabled: true,
            errorMessage: '',
            selected: props.selected === 'Github'
        };

        this.processTeamNameDebounced = _.debounce(this.processTeamName, 400);

        _.bindAll(
            this,
            'listPolicies',
            'renderPolicies',
            'policyChecked',
            'teamNameChanged',
            'submitGithubPolicy',
            'requestOrganization',
            'renderOrganizationDialog',
            'getTeamPolicy',
            'processTeamName'
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
            window.localStorage.setItem('githubOrganization', this.state.tmpOrganization)
            this.setState({
                organization: this.state.tmpOrganization,
                requestOrganization: false
            });
        };

        let closeDialog = (e) => {
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
        callVaultApi('get', 'sys/policy', null, null, null)
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

    submitGithubPolicy() {
        callVaultApi('post', `auth/github/map/teams/${this.state.teamName}`, null, { value: this.state.checkedPolicies }, null)
            .then((resp) => {

            })
            .catch((err) => {
                this.setState({ errorMessage: err });
            });
    }

    getTeamPolicy(teamName) {
        let uri = encodeURI(`auth/github/map/teams/${this.state.teamName}`);
        callVaultApi('get', uri, null, null, null)
            .then((resp) => {
                let policyNames = _.get(resp, "data.data.value").split(',');

                _.forEach(this.state.policies, (policy) => {
                    policy.checked = (policyNames.indexOf(policy.name) > -1);
                });
                this.setState({
                    policies: this.state.policies
                });
            })
            .catch((err) => {
                this.setState({ errorMessage: `${err} - URI: ${decodeURI(uri)}` });
            });
    }

    teamNameChanged(e, v) {
        if (v === '') {
            _.forEach(this.state.policies, (policy) => {
                policy.checked = false;
            });

            this.setState({
                policies: this.state.policies
            });
        } else {
            this.state.teamName = v;
            this.processTeamNameDebounced();
        }

    }

    processTeamName() {
        this.getTeamPolicy(this.state.teamName);
        this.setState({
            teamName: this.state.teamName,
            submitBtnDisabled: !(this.state.checkedPolicies && this.state.organization && this.state.teamName),
            submitBtnColor: (this.state.checkedPolicies && this.state.organization && this.state.teamName) ? green500 : 'lightgrey'
        });
    }

    policyChecked(policyName, e, isChecked) {
        let policies = this.state.policies;

        let policyToCheck = _.find(policies, (policyToCheck) => { return policyToCheck.name == policyName; });
        if (policyToCheck !== undefined)
            policyToCheck.checked = isChecked;

        let checkedPolicies = _.map(_.filter(policies, (policy) => {
            return policy.checked;
        }), (policy) => {
            return policy.name;
        }).toString();

        this.setState({
            policies: policies,
            checkedPolicies: checkedPolicies,
            submitBtnDisabled: !(checkedPolicies && this.state.organization && this.state.teamName),
            submitBtnColor: (checkedPolicies && this.state.organization && this.state.teamName) ? green500 : 'lightgrey'
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

    render() {
        return (
            <div>
                {this.renderOrganizationDialog()}
                <Tabs>
                    <Tab label="GITHUB SETTINGS" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can view, update, and delete policies assigned to teams in your Github org.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <div key="org">
                                <p>Current Organization: <span className={styles.orgName}>{this.state.organization ? <FlatButton label={this.state.organization.toUpperCase()} primary={true} onTouchTap={() => this.setState({ requestOrganization: true })} /> : ""}</span></p>

                            </div>
                            <div key="team">
                                <TextField
                                    fullWidth={false}
                                    className="col-xs-12"
                                    hintText="Team Name"
                                    onChange={this.teamNameChanged}
                                />
                            </div>
                            {this.renderPolicies()}
                            {this.state.policies.length > 0 && <FlatButton
                                label="Apply"
                                backgroundColor={this.state.submitBtnColor}
                                hoverColor={green400}
                                disabled={this.state.submitBtnDisabled}
                                labelStyle={{ color: white }}
                                onTouchTap={() => this.submitGithubPolicy()} />}
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
