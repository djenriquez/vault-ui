import React, { PropTypes } from 'react';
import { callVaultApi, tokenHasCapabilities } from '../VaultUtils.jsx'
import _ from 'lodash';
import { List, ListItem } from 'material-ui/List';
import styles from './policypicker.css';
import KeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import AutoComplete from 'material-ui/AutoComplete';
import Clear from 'material-ui/svg-icons/content/clear';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import UltimatePagination from 'react-ultimate-pagination-material-ui'
import update from 'immutability-helper';

const LIST_TYPE = {
    SELECTED: 'selected',
    AVAILABLE: 'available'
};

class PolicyPicker extends React.Component {
    static propTypes = {
        onError: PropTypes.func,
        onSelectedChange: PropTypes.func,
        excludePolicies: PropTypes.array,
        selectedPolicies: PropTypes.array,
        height: PropTypes.string,
        type: PropTypes.string,
        item: PropTypes.string,
        vaultPath: PropTypes.string
    };

    static defaultProps = {
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
            searchText: '',
            itemsRaw: [],
            available: {
                maxItemsPerPage: 7,
                sortDirection: 'asc',
                currentPage: 1,
                totalPages: 1,
                pageItems: [],
                parsedItems: [],
                items: []
            },
            selected: {
                maxItemsPerPage: 7,
                sortDirection: 'asc',
                currentPage: 1,
                totalPages: 1,
                pageItems: [],
                parsedItems: [],
                items: this.props.selectedPolicies
            }
        };

        _.bindAll(
            this,
            'loadPolicyList',
            'selectedPolicyAdd',
            'selectedPolicyRemove',
            'setPage'
        )

        this.loadPolicyList(this.props.type);
    }

    loadPolicyList(type) {
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
                            available: update(this.state.available, {
                                items: { $set: policyList }
                            }),
                            itemsRaw: policyList
                        });
                        this.setPage(LIST_TYPE.AVAILABLE, 1);
                        this.setPage(LIST_TYPE.SELECTED, 1);
                    })
                    .catch(this.props.onError)
            })
            .catch(() => {

            });
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.selectedPolicies.sort(), nextProps.selectedPolicies.sort())) {
            this.setState({
                selected: update(this.state.selected, {
                    items: { $set: nextProps.selectedPolicies }
                })
            });
        }
    }

    // componentDidMount() {
    //     this.setPage(LIST_TYPE.AVAILABLE, 1);
    // }

    componentWillUpdate(nextProps, nextState) {
        if (!_.isEqual(this.state.selected.items.sort(), nextState.selected.items.sort())) {
            this.props.onSelectedChange(nextState.selected.items);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        let newAvailPol = _(this.state.available.items).difference(this.state.selected.items).value();

        if (
            (!_.isEqual(this.state.selected.items.sort(), prevState.selected.items.sort())) ||
            (!_.isEqual(this.state.available.items.sort(), prevState.available.items.sort())) ||
            (this.state.searchText !== prevState.searchText)
        ) {
            let newList = _.filter(newAvailPol, (item) => {
                return _.includes(item, this.state.searchText);
            });

            this.setState({ available: update(this.state.available, { items: { $set: newList } }) });
        }
    }


    selectedPolicyAdd(v) {
        this.setState({
            selected: update(this.state.selected, {
                pageItems: { $set: _(this.state.selected.pageItems).concat(v).value() },
                items: { $set: _(this.state.selected.items).concat(v).value() }
            }),
            available: update(this.state.available, {
                pageItems: { $set: _(this.state.available.pageItems).without(v).value() },
                items: { $set: _(this.state.available.items).without(v).value() }
            })
        });
    }

    selectedPolicyRemove(v) {
        this.setState({
            selected: update(this.state.selected, {
                pageItems: { $set: _(this.state.selected.pageItems).without(v).value() },
                items: { $set: _(this.state.selected.items).without(v).value() }
            }),
            available: update(this.state.available, {
                pageItems: { $set: _(this.state.available.pageItems).concat(v).value() },
                items: { $set: _(this.state.available.items).concat(v).value() }
            })
        });
    }

    setPage(listType, page = null, sortDirection = null, maxItemsPerPage = null) {
        // Defaults
        let list = listType == LIST_TYPE.SELECTED ? this.state.selected : this.state.available;
        page = page ? page : list.currentPage;
        sortDirection = sortDirection ? sortDirection : list.sortDirection;
        maxItemsPerPage = maxItemsPerPage ? maxItemsPerPage : list.maxItemsPerPage;

        let maxPage = Math.ceil(list.items.length / maxItemsPerPage);
        // Never allow to set to higher page than max
        page = page > maxPage ? maxPage : page
        // Never allow a 0th or negative page
        page = page <= 0 ? 1 : page;

        let sortedItems = _.orderBy(list.items, _.identity, sortDirection);
        let parsedItems = _.chunk(sortedItems, maxItemsPerPage);

        if (listType === LIST_TYPE.AVAILABLE) {
            this.setState(
                {
                    available: update(this.state.available, {
                        currentPage: { $set: page },
                        totalPages: { $set: Math.ceil(list.items.length / maxItemsPerPage) },
                        parsedItems: { $set: parsedItems },
                        pageItems: { $set: parsedItems[page - 1] ? parsedItems[page - 1].filter(Boolean) : [] }
                    })
                });
        } else if (listType === LIST_TYPE.SELECTED) {
            this.setState(
                {
                    selected: update(this.state.selected, {
                        currentPage: { $set: page },
                        totalPages: { $set: Math.ceil(sortedItems.length / maxItemsPerPage) },
                        parsedItems: { $set: parsedItems },
                        pageItems: { $set: parsedItems[page - 1] ? parsedItems[page - 1].filter(Boolean) : [] }
                    })
                });
        }
    }


    render() {

        let renderAvailablePoliciesListItems = () => {
            return _.map(this.state.available.pageItems, (key) => {
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
            return _.map(this.state.selected.pageItems, (key) => {
                let style = {};

                if (!_(this.state.itemsRaw).includes(key)) {
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

                            <AutoComplete
                                searchText={this.state.searchText}
                                dataSource={this.state.available.items}
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
                            {renderAvailablePoliciesListItems()}
                        </List>
                    </div>
                    <UltimatePagination
                        currentPage={this.state.available.currentPage}
                        totalPages={this.state.available.totalPages}
                        onChange={(e) => {
                            this.setPage(LIST_TYPE.AVAILABLE, e)
                        }}
                    />
                </div>

                <div style={{ marginLeft: "1%" }} className={styles.ppColumn}>
                    <Toolbar className={styles.ppToolbar}>
                        <ToolbarGroup>
                            <ToolbarTitle text={`Selected ${this.props.item}`} />
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
