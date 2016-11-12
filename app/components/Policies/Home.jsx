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
import { Tabs, Tab } from 'material-ui/Tabs';
import Manage from './Manage.jsx';
import Github from './Github.jsx';
import EC2 from './Ec2.jsx';

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'Manage'
        }
    }

    render() {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Policies</h1>
                <Tabs
                    value={this.state.currentTab}
                    onChange={(v) => this.setState({ currentTab: v })}
                    >
                    <Tab label="Manage" value="Manage" >
                        <Manage />
                    </Tab>
                    <Tab label="Github" value="Github" >
                        <Github />
                    </Tab>
                    <Tab label="EC2" value="EC2" >
                        <EC2 />
                    </Tab>
                </Tabs>
            </div>
        );

    }
}