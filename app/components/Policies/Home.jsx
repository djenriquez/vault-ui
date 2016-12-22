import axios from 'axios';
import React, { PropTypes } from 'react'
import _ from 'lodash';
import styles from './policies.css';
import Manage from './Manage.jsx';
import Github from './Github.jsx';
import EC2 from './Ec2.jsx';

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.renderPolicyPage = this.renderPolicyPage.bind(this);
        this.state = {
            currentTab: 'Manage',
            requestOrganization: false,
            organization: window.localStorage.getItem('githubOrganization') || ''
        }

        _.bindAll(
            this,
            'requestOrganization',
            'renderOrganizationDialog'
        );
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
                    onChange={(e, v) => this.setState({ tmpOrganization: v})}
                    />
                <div className={styles.error}>{this.state.errorMessage}</div>
            </Dialog>
        )
    }

    renderPolicyPage() {
        switch (this.props.params.policy) {
            case 'manage':
                return <Manage />
            case 'github':
                return <Github organization=""/>
            case 'ec2':
                return <EC2 />
            }
    }

    render() {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Policies</h1>

                {this.renderPolicyPage()}
            </div>
        );

    }
}

//                 <Tabs
//                     value={this.state.currentTab}
//                     onChange={(v) => this.setState({ currentTab: v })}
//                     >
//                     <Tab label="Manage" value="Manage" >
//                         <Manage />
//                     </Tab>
//                     <Tab label="Github" value="Github" onActive={this.requestOrganization} >
//                         <Github id="gh" />
//                         {gh.state.requestOrganization && this.renderOrganizationDialog()}
//                     </Tab>
//                     <Tab label="EC2" value="EC2" >
//                         <EC2 />
//                     </Tab>
//                 </Tabs>
// =======
