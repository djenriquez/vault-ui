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

export default class Manage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            organization: '',
            teamName: '',
            policies: [],
            checkedPolicy: ''
        };

        _.bindAll(
            this,
            'listPolicies',
            'renderPolicies',
            'policyChecked'
        );

    }

    componentWillMount() {
        this.listPolicies();
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

    policyChecked(policyName, e, v) {

        let policies = this.state.policies;

        _.forEach(policies, (policy)=> {
            policy.checked = false;
        });

        let policyToCheck = _.find(policies, (policyToCheck) => { return policyToCheck.name == policyName; });

        policyToCheck.checked = true;

        this.setState({
            policies: policies,
            checkedPolicy: policyToCheck.name
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
                    onTouchTap={() => { this.clickPolicy(policy.name) } }
                    primaryText={<div className={policy.name}>{policy.name}</div>}
                    >
                </ListItem>
            );
        });
    }



    render() {
        return (
            <div>
                <h2>Github</h2>
                <p>Here you can view, update, and delete policies assigned to teams in your Github org.</p>
                <h3>Current Organization: <span className={styles.orgName}>{this.state.organization.toUpperCase()}</span></h3>
                <TextField
                    fullWidth={false}
                    className="col-xs-12"
                    hintText="Team Name"
                    onChange={(e, v) => { this.setState({ teamName: v }) } }
                    />
                {this.renderPolicies()}
            </div>
        );
    }
}