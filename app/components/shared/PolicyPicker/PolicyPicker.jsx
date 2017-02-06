import React, { PropTypes } from 'react';
import { callVaultApi, tokenHasCapabilities } from '../VaultUtils.jsx'
import _ from 'lodash';
import { browserHistory } from 'react-router';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import styles from './policypicker.css';
import { lightBlue50, indigo400 } from 'material-ui/styles/colors.js'
import KeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import KeyboardArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import AutoComplete from 'material-ui/AutoComplete';
import Search from 'material-ui/svg-icons/action/search';
import Paper from 'material-ui/Paper';
import Clear from 'material-ui/svg-icons/content/clear';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import { Menu, MenuItem } from 'material-ui/Menu';

class PolicyPicker extends React.Component {
    static propTypes = {
        onError: PropTypes.func,
        onSelectedChange: PropTypes.func,
        excludePolicies: PropTypes.array,
        title: PropTypes.string,
        height: PropTypes.string,
    };

    static defaultProps = {
        onError: (err) => { console.error(err) },
        onSelectedChange: (selectedPolicies) => {},
        excludePolicies: ['default'],
        title: "Policy Picker",
        height: "300px",
    };

    constructor(props) {
        super(props);

        this.state = {
            availablePolicies: [],
            displayedAvailPolicies: [],
            selectedPolicies: [],
            manualPolicies: [],
            policyListAvailable: true,
            searchText: ''
        };

        _.bindAll(
            this,
            'reloadPolicyList',
            'selectedPolicyAdd',
            'selectedPolicyRemove'
        )
    };

    reloadPolicyList() {
        tokenHasCapabilities(['read'], 'sys/policy')
            .then(() => {
                callVaultApi('get', 'sys/policy', null, null, null)
                    .then((resp) => {

                        let policyList = _.filter(resp.data.data.keys, (item) => {
                            return (!_.includes(this.props.excludePolicies, item)) && ( item !== 'root');
                        })

                        this.setState({
                            availablePolicies: policyList,
                            policyListAvailable: true
                        });
                    })
                    .catch(this.props.onError)
            })
            .catch(() => {
                this.setState({ policyListAvailable: false })
            })
    }

    componentDidMount() {
        this.reloadPolicyList();
    }

    componentWillUpdate(nextProps, nextState) {
        if (!_.isEqual(this.state.selectedPolicies.sort(), nextState.selectedPolicies.sort())) {
            this.props.onSelectedChange(nextState.selectedPolicies);
        }
    }
    

    componentDidUpdate(prevProps, prevState) {
        let newAvailPol = _(this.state.availablePolicies).difference(this.state.selectedPolicies).value();

        if (
            (!_.isEqual(this.state.selectedPolicies.sort(), prevState.selectedPolicies.sort())) ||
            (!_.isEqual(this.state.availablePolicies.sort(), prevState.availablePolicies.sort())) ||
            (this.state.searchText !== prevState.searchText)
         ) {
            let newList = _.filter(newAvailPol, (item) => {
                return _.includes(item, this.state.searchText);
            });
            this.setState({
                displayedAvailPolicies: newList
            });
        }

        

    }


    selectedPolicyAdd(v) {
        this.setState({
            selectedPolicies: _(this.state.selectedPolicies).concat(v).value(),
            displayedAvailPolicies: _(this.state.displayedAvailPolicies).without(v).value(),
        })
    }

    selectedPolicyRemove(v) {
        this.setState({
            selectedPolicies: _(this.state.selectedPolicies).without(v).value(),
            displayedAvailPolicies: _(this.state.displayedAvailPolicies).concat(v).value(),
        })
    }

    render() {

        let renderAvailablePoliciesListItems = () => {
            return _.map(this.state.displayedAvailPolicies, (key) => {
                return (
                    <ListItem
                        className={styles.ppList}
                        onTouchTap={() => { this.selectedPolicyAdd(key) } }
                        key={key}
                        rightIcon={<KeyboardArrowRight />}
                        primaryText={key}
                        />
                )
            });
        };

        let renderSelectedPoliciesListItems = () => {
            return _.map(this.state.selectedPolicies, (key) => {
                let style = {};

                if (!_(this.state.availablePolicies).includes(key)) {
                    style = { color: "#FF7043" }
                }
                return (
                    <ListItem
                        className={styles.ppList}
                        onTouchTap={() => { this.selectedPolicyRemove(key) } }
                        style={style}
                        key={key}
                        rightIcon={<Clear />}
                        primaryText={key}
                        />
                )
            });
        };

        return (
            <div className={styles.ppContainer}>
                <div style={{ marginRight: "1%" }} className={styles.ppColumn}>
                    <Toolbar className={styles.ppToolbar}>
                        <ToolbarGroup>
                            <ToolbarTitle text="Available Policies" />
                        </ToolbarGroup>
                        <ToolbarGroup lastChild={true}>
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{height: this.props.height}} className={styles.ppListContainer}>
                        <List>
                            {renderAvailablePoliciesListItems()}
                        </List>
                    </div>
                </div>
                <div style={{ marginLeft: "1%" }} className={styles.ppColumn}>
                    <Toolbar className={styles.ppToolbar}>
                        <ToolbarGroup>
                            <ToolbarTitle text="Selected Policies" />
                        </ToolbarGroup>
                        <ToolbarGroup lastChild={true}>

                            <AutoComplete
                                searchText={this.state.searchText}
                                dataSource={this.state.displayedAvailPolicies}
                                hintText='Search or add custom'
                                onUpdateInput={(searchText) => {
                                    this.setState({
                                        searchText: searchText
                                    });
                                } }
                                onNewRequest={(chosenRequest, index) => {
                                    if (
                                        (!_.includes(this.props.excludePolicies, chosenRequest)) &&
                                        (chosenRequest !== 'root')
                                    ) {
                                        this.selectedPolicyAdd(chosenRequest);
                                        this.setState({
                                            searchText: ''
                                        })
                                    }
                                } }
                                />
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{height: this.props.height}} className={styles.ppListContainer}>
                        <List>
                            {renderSelectedPoliciesListItems()}
                        </List>
                    </div>
                </div>
            </div>
        )
    };

}

export default PolicyPicker;