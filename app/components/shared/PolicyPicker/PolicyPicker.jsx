import React, { PropTypes } from 'react';
import { callVaultApi, tokenHasCapabilities } from '../VaultUtils.jsx'
import _ from 'lodash';
import { List, ListItem } from 'material-ui/List';
import styles from './policypicker.css';
import KeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import AutoComplete from 'material-ui/AutoComplete';
import Clear from 'material-ui/svg-icons/content/clear';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';

class PolicyPicker extends React.Component {
    static propTypes = {
        onError: PropTypes.func,
        onSelectedChange: PropTypes.func,
        excludePolicies: PropTypes.array,
        selectedPolicies: PropTypes.array,
        fixedPolicyList: PropTypes.array,
        height: PropTypes.string,
        type: PropTypes.string,
        item: PropTypes.string,
        vaultPath: PropTypes.string
    };

    static defaultProps = {
        fixedPolicyList: [],
        selectedPolicies: [],
        onError: (err) => { console.error(err) },
        onSelectedChange: () => { },
        excludePolicies: [],
        height: "300px",
        item: "policies",
        type: "policy"
    };

    constructor(props) {
        super(props);

        this.state = {
            availablePolicies: this.props.fixedPolicyList,
            displayedAvailPolicies: [],
            selectedPolicies: this.props.selectedPolicies,
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
    }

    reloadPolicyList(type) {
        let allowed_methods = ['']
        let http_method = ''
        let path = ''
        let params = null
        switch (type) {
            case "okta/users":
                allowed_methods = ['list']
                http_method = 'get'
                params = { list: true }
                path = this.props.vaultPath
                break;
            default:
                allowed_methods = ['read']
                http_method = 'get'
                path = 'sys/policy'
                break;
        }
        tokenHasCapabilities(allowed_methods, path)
            .then(() => {
                callVaultApi(http_method, path, params, null, null)
                    .then((resp) => {
                        let policyList = []

                        if (this.props.type === 'policy') {
                            policyList = _.filter(resp.data.data.keys, (item) => {
                                return (!_.includes(this.props.excludePolicies, item)) && (item !== 'root');
                            })
                        } else {
                            policyList = _.filter(resp.data.data.keys, (item) => {
                                return (!_.includes(this.props.excludePolicies, item));
                            })
                        }

                        this.setState({
                            availablePolicies: policyList,
                            policyListAvailable: true
                        });
                    })
                    .catch(this.props.onError)
            })
            .catch(() => {
                this.setState({ policyListAvailable: false })
            });
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.selectedPolicies, nextProps.selectedPolicies)) {
            this.setState({ selectedPolicies: nextProps.selectedPolicies })
        }
    }

    componentDidMount() {
        if (_.isEmpty(this.props.fixedPolicyList)) {
            this.reloadPolicyList(this.props.type);
        }
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
                        onTouchTap={() => { this.selectedPolicyAdd(key) }}
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
                        onTouchTap={() => { this.selectedPolicyRemove(key) }}
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
                            <ToolbarTitle text={`Available ${this.props.item}`} />
                        </ToolbarGroup>
                        <ToolbarGroup lastChild={true}>
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{ height: this.props.height }} className={styles.ppListContainer}>
                        <List>
                            {renderAvailablePoliciesListItems()}
                        </List>
                    </div>
                </div>
                <div style={{ marginLeft: "1%" }} className={styles.ppColumn}>
                    <Toolbar className={styles.ppToolbar}>
                        <ToolbarGroup>
                            <ToolbarTitle text={`Selected ${this.props.item}`} />
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
                                }}
                                onNewRequest={(chosenRequest) => {
                                    if (
                                        (!_.includes(this.props.excludePolicies, chosenRequest)) &&
                                        (chosenRequest !== 'root')
                                    ) {
                                        this.selectedPolicyAdd(chosenRequest);
                                        this.setState({
                                            searchText: ''
                                        })
                                    }
                                }}
                            />
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{ height: this.props.height }} className={styles.ppListContainer}>
                        <List>
                            {renderSelectedPoliciesListItems()}
                        </List>
                    </div>
                </div>
            </div>
        )
    }
}

export default PolicyPicker;
