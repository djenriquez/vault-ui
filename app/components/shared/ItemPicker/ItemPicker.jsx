import React, { PropTypes } from 'react';
import { callVaultApi, tokenHasCapabilities } from '../VaultUtils.jsx'
import _ from 'lodash';
import { List, ListItem } from 'material-ui/List';
import styles from './itempicker.css';
import KeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import AutoComplete from 'material-ui/AutoComplete';
import Clear from 'material-ui/svg-icons/content/clear';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import UltimatePagination from 'react-ultimate-pagination-material-ui'
import update from 'immutability-helper';
import sharedStyles from '../styles.css';

const LIST_TYPE = {
    SELECTED: 'selected',
    AVAILABLE: 'available'
};

function snackBarMessage(message) {
    document.dispatchEvent(new CustomEvent('snackbar', { detail: { message: message } }));
}

export default class ItemPicker extends React.Component {
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

            available: {
                maxItemsPerPage: 7,
                sortDirection: 'asc',
                currentPage: 1,
                totalPages: 1,
                pageItems: [],
                pagedItems: [],
                items: [],
                searchText: ''
            },
            selected: {
                maxItemsPerPage: 7,
                sortDirection: 'asc',
                currentPage: 1,
                totalPages: 1,
                pageItems: [],
                pagedItems: [],
                items: [],
                searchText: ''
            }
        };

        _.bindAll(
            this,
            'loadItemList',
            'selectedItemAdd',
            'selectedItemRemove',
            'setPage'
        )

        this.loadItemList(this.props.type);
    }

    loadItemList(type) {
        let allowed_methods = ['']
        let http_method = ''
        let path = ''
        let params = null

        // Determine item type
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

        // Make Vault API call
        tokenHasCapabilities(allowed_methods, path)
            .then(() => {
                callVaultApi(http_method, path, params, null, null)
                    .then((resp) => {
                        let itemList = []

                        if (this.props.type === 'policy') {
                            itemList = _.filter(resp.data.data.keys, (item) => {
                                return (!_.includes(this.props.excludePolicies, item)) && (item !== 'root');
                            })
                        } else {
                            itemList = _.filter(resp.data.data.keys, (item) => {
                                return (!_.includes(this.props.excludePolicies, item));
                            })
                        }
                        this.setState({
                            available: update(this.state.available, {
                                items: { $set: itemList }
                            })
                        });
                    })
                    .catch(this.props.onError)
            })
            .catch(snackBarMessage)
    }

    componentDidMount() {
        this.setState({ selected: update(this.state.selected, { items: { $set: this.props.selectedPolicies } }) });
    }

    componentWillReceiveProps(nextProps) {
        // Updates the module when reselected
        if (!_.isEqual(this.props.selectedPolicies.sort(), nextProps.selectedPolicies.sort())) {
            this.setState({
                selected: update(this.state.selected, {
                    items: { $set: nextProps.selectedPolicies }
                })
            });
        }
    }

    componentWillUpdate(nextProps, nextState) {
        // Throw event when selected itemlist changes
        if (!_.isEqual(this.state.selected.items.sort(), nextState.selected.items.sort())) {
            this.props.onSelectedChange(nextState.selected.items);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Update available or selected if items change
        if (
            !_.isEqual(this.state.selected.items.sort(), prevState.selected.items.sort()) ||
            this.state.selected.searchText !== prevState.selected.searchText
        ) {
            this.setPage(LIST_TYPE.SELECTED, 1);
        }
        if (
            !_.isEqual(this.state.available.items.sort(), prevState.available.items.sort()) ||
            this.state.available.searchText !== prevState.available.searchText
        ) {
            this.setPage(LIST_TYPE.AVAILABLE, 1);
        }
    }


    selectedItemAdd(v) {
        let available = update(this.state.available, {
            pageItems: { $set: _(this.state.available.pageItems).without(v).value() }
        });
        let selected = update(this.state.selected, {
            pageItems: { $set: _(this.state.selected.pageItems).concat(v).value() },
            items: { $set: _(this.state.selected.items).concat(v).value() }
        });

        this.setState({
            selected: selected,
            available: available
        });
    }

    selectedItemRemove(v) {
        let available = update(this.state.available, {
            pageItems: { $set: _(this.state.available.pageItems).concat(v).value() }
        });
        let selected = update(this.state.selected, {
            pageItems: { $set: _(this.state.selected.pageItems).without(v).value() },
            items: { $set: _(this.state.selected.items).without(v).value() }
        })

        // If items exists in the available items (not added in), do not add into available items
        if (_.indexOf(this.state.available.items, v) >= 0) {
            this.setState({
                selected: selected,
                available: available
            });
        } else {
            this.setState({
                selected: selected
            });
        }

    }

    setPage(listType, page = null, sortDirection = null, maxItemsPerPage = null) {
        // Defaults
        var list = listType == LIST_TYPE.SELECTED ? _.clone(this.state.selected) : _.clone(this.state.available);
        page = page ? page : list.currentPage;
        sortDirection = sortDirection ? sortDirection : list.sortDirection;
        maxItemsPerPage = maxItemsPerPage ? maxItemsPerPage : list.maxItemsPerPage;

        let maxPage = Math.ceil(list.items.length / maxItemsPerPage);
        // Never allow to set to higher page than max
        page = page > maxPage ? maxPage : page
        // Never allow a 0th or negative page
        page = page <= 0 ? 1 : page;

        // Filter
        if (listType === LIST_TYPE.AVAILABLE) {
            let selectedAvailableItems = _(this.state.available.items).difference(this.state.selected.items).value();
            list.items = _.filter(selectedAvailableItems, (item) => {
                return _.includes(item, list.searchText);
            });
        }

        // Sort
        let sortedItems = _.orderBy(list.items, _.identity, sortDirection);
        let pagedItems = _.chunk(sortedItems, maxItemsPerPage);

        if (listType === LIST_TYPE.AVAILABLE) {
            this.setState(
                {
                    available: update(this.state.available, {
                        currentPage: { $set: page },
                        totalPages: { $set: Math.ceil(list.items.length / maxItemsPerPage) },
                        pagedItems: { $set: pagedItems },
                        pageItems: { $set: pagedItems[page - 1] ? pagedItems[page - 1].filter(Boolean) : [] }
                    })
                });
        } else if (listType === LIST_TYPE.SELECTED) {
            this.setState(
                {
                    selected: update(this.state.selected, {
                        currentPage: { $set: page },
                        totalPages: { $set: Math.ceil(sortedItems.length / maxItemsPerPage) },
                        pagedItems: { $set: pagedItems },
                        pageItems: { $set: pagedItems[page - 1] ? pagedItems[page - 1].filter(Boolean) : [] }
                    })
                });
        }
    }


    render() {

        let renderAvailableListItems = () => {
            return _.map(this.state.available.pageItems, (key) => {
                return (
                    <ListItem
                        className={styles.ppList}
                        onTouchTap={() => { this.selectedItemAdd(key) }}
                        key={key}
                        rightIcon={<KeyboardArrowRight />}
                        primaryText={key}
                    />
                )
            });
        };

        let renderSelectedListItems = () => {
            return _.map(this.state.selected.pageItems, (key) => {
                let style = {};

                if (!_(this.state.available.items).includes(key)) {
                    style = { color: "#FF7043" }
                }
                return (
                    <ListItem
                        className={styles.ppList}
                        onTouchTap={() => { this.selectedItemRemove(key) }}
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
                                searchText={this.state.available.searchText}
                                dataSource={this.state.available.items}
                                hintText='Search or add custom'
                                onUpdateInput={(searchText) => {
                                    this.setState({ available: update(this.state.available, { searchText: { $set: searchText } }) });
                                }}
                                onNewRequest={(chosenRequest) => {
                                    if (
                                        (!_.includes(this.props.excludePolicies, chosenRequest)) &&
                                        (chosenRequest !== 'root')
                                    ) {
                                        this.selectedItemAdd(chosenRequest);
                                        this.setState({ available: update(this.state.available, { searchText: { $set: '' } }) });
                                    }
                                }}
                            />
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{ height: this.props.height }} className={styles.ppListContainer}>
                        <List>
                            {renderAvailableListItems()}
                        </List>
                    </div>
                    <div className={sharedStyles.centered}>
                        <UltimatePagination
                            currentPage={this.state.available.currentPage}
                            totalPages={this.state.available.totalPages}
                            onChange={(e) => {
                                this.setPage(LIST_TYPE.AVAILABLE, e)
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginLeft: "1%" }} className={styles.ppColumn}>
                    <Toolbar className={styles.ppToolbar}>
                        <ToolbarGroup>
                            <ToolbarTitle text={`Selected ${this.props.item}`} />
                        </ToolbarGroup>
                    </Toolbar>
                    <div style={{ height: this.props.height }} className={styles.ppListContainer}>
                        <List>
                            {renderSelectedListItems()}
                        </List>
                    </div>
                </div>
            </div>
        )
    }
}