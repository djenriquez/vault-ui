import React, { PropTypes } from 'react';
import Avatar from 'material-ui/Avatar';

import FileFolder from 'material-ui/svg-icons/file/folder';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';

import { List, ListItem } from 'material-ui/List';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import sharedStyles from '../../shared/styles.css';
import VaultObjectDeleter from '../../shared/DeleteObject/DeleteObject.jsx'
import UltimatePagination from 'react-ultimate-pagination-material-ui'

import { red500 } from 'material-ui/styles/colors.js';

const SORT_DIR = {
    ASC: 'asc',
    DESC: 'desc'
};

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class ItemList extends React.Component {

    static propTypes = {
        itemList: PropTypes.array.isRequired,
        itemUri: PropTypes.string.isRequired,
        maxItemsPerPage: PropTypes.number,
        onTouchTap: PropTypes.func,
        onDeleteTap: PropTypes.func.isRequired,
        onCustomListRender: PropTypes.func
    };

    constructor(props) {
        super(props);

        this.itemUri = this.props.itemUri;
        this.itemListFull = [];
        this.filteredItemList = [];
        this.lastMaxItemsPerPage = 25;

        this.state = {
            // itemListFull: this.props.itemList,
            // filteredItemList: this.props.itemList,
            maxItemsPerPage: this.props.maxItemsPerPage ? this.props.maxItemsPerPage : 25,
            pageItems: [],
            parsedItems: [],
            filterString: '',
            sortDirection: SORT_DIR.ASC,
            currentPage: 1,
            totalPages: 1,
            deletePath: '',
            openDelete: false
        };

        _.bindAll(
            this,
            'renderItemList',
            'setPage'
        );
    }


    renderItemList() {
        let directories = _.filter(this.state.pageItems, (item) => {
            return this.isPathDirectory(item);
        });
        var isFolder = directories.length > 0 ? true : false;

        return _.map(_.sortBy(this.state.pageItems, (item) => {
            if (this.isPathDirectory(item)) return 0;
        }), (item) => {
            var avatar = this.isPathDirectory(item) ? (<Avatar icon={<FileFolder />} />) : (<Avatar icon={<ActionAccountBox />} />);
            var action = this.isPathDirectory(item) ? (<IconButton />) : (
                <IconButton
                    tooltip='Delete'
                    onTouchTap={() => this.setState({ deletePath: `${this.itemUri}/${item}`, openDelete: true })}
                >
                    {window.localStorage.getItem('showDeleteModal') === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                </IconButton>
            );

            if (!this.isPathDirectory(item) && isFolder) {
                isFolder = false;
                return ([
                    <Divider inset={true} />,
                    <ListItem
                        key={item}
                        primaryText={item}
                        insetChildren={true}
                        leftAvatar={avatar}
                        rightIconButton={action}
                        onTouchTap={this.props.onTouchTap && this.props.onTouchTap.bind(null, item)}
                    />
                ])
            } else return (
                <ListItem
                    key={item}
                    primaryText={item}
                    insetChildren={true}
                    leftAvatar={avatar}
                    rightIconButton={action}
                    onTouchTap={this.props.onTouchTap && this.props.onTouchTap.bind(null, item)}
                />
            )
        });
    }

    isPathDirectory(key) {
        if (!key) key = '/';
        return (key[key.length - 1] === '/');
    }

    filterItems(filter) {
        if (filter) {
            this.filteredItemList = _.filter(this.itemListFull, (item) => {
                return item.toLowerCase().includes(filter.toLowerCase());
            })
        } else {
            this.filteredItemList = this.itemListFull;
        }
    }

    setPage(page = null, sortDirection = null, maxItemsPerPage = null) {
        // Defaults
        page = page ? page : this.state.currentPage;
        sortDirection = sortDirection ? sortDirection : this.state.sortDirection;
        maxItemsPerPage = maxItemsPerPage ? maxItemsPerPage : this.state.maxItemsPerPage;

        let maxPage = Math.ceil(this.filteredItemList.length / maxItemsPerPage);
        // Never allow to set to higher page than max
        page = page > maxPage ? maxPage : page
        // Never allow a 0th or negative page
        page = page <= 0 ? 1 : page;

        let sortedItems = _.orderBy(this.filteredItemList, _.identity, sortDirection);
        let parsedItems = _.chunk(sortedItems, maxItemsPerPage);
        this.setState(
            {
                currentPage: page,
                totalPages: Math.ceil(sortedItems.length / maxItemsPerPage),
                parsedItems: parsedItems,
                pageItems: parsedItems[page - 1]
            });
    }

    resetPage() {
        this.setState({
            currentPage: 1
        });
    }

    // Events
    componentDidMount() {
        this.setPage(1);
    }

    componentWillUpdate(nextProps, nextState) {
        if (!nextProps.maxItemsPerPage) {
            this.lastMaxItemsPerPage = this.state.maxItemsPerPage;
        }
    }

    componentWillReceiveProps(nextProps) {
        this.itemListFull = nextProps.itemList;
        this.filterItems(this.state.filterString);
        this.setPage();
    }

    render() {
        return (
            <div>
                <VaultObjectDeleter
                    path={this.state.deletePath}
                    modalOpen={this.state.modalOpen}
                    onReceiveResponse={this.props.onDeleteTap.bind(null, this.state.deletePath)}
                    onReceiveError={(err) => snackBarMessage(err)}
                />
                <Toolbar>
                    <ToolbarGroup lastChild={true} className="col-xs-12 col-xs-1 col-xs-1">
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelText="Filter"
                            hintText="Filter items"
                            className="col-xs-8"
                            value={this.state.filterString}
                            onChange={(e, v) => {
                                this.setState({ filterString: v });
                                this.filterItems(v);
                                this.setPage(this.state.currentPage, this.state.sortDirection)
                            }}
                        />
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelText="Max Items"
                            hintText="Max Items"
                            className="col-xs-2"
                            value={this.state.maxItemsPerPage}
                            onBlur={() => {
                                if (!this.state.maxItemsPerPage) {
                                    this.setState({ maxItemsPerPage: this.lastMaxItemsPerPage });
                                }
                            }}
                            onChange={(e, v) => {
                                this.setState({ maxItemsPerPage: v });
                                this.setPage(this.state.currentPage, this.state.sortDirection, v)
                            }}
                        />
                        <SelectField
                            autoWidth={true}
                            floatingLabelText="Sort Items"
                            floatingLabelFixed={true}
                            value={this.state.sortDirection}
                            className="col-xs-2"
                            onChange={(e, i, v) => {
                                this.setPage(this.state.currentPage, v);
                            }}
                        >
                            <MenuItem value={SORT_DIR.ASC} primaryText="Ascending" />
                            <MenuItem value={SORT_DIR.DESC} primaryText="Descending" />
                        </SelectField>
                    </ToolbarGroup>
                </Toolbar>
                <List className={sharedStyles.listStyle}>
                    {(this.props.onCustomListRender && this.props.onCustomListRender()) || this.renderItemList()}
                </List>
                <div className={sharedStyles.centered}>
                    <UltimatePagination
                        currentPage={this.state.currentPage}
                        totalPages={this.state.totalPages}
                        onChange={(e) => {
                            this.setPage(e, this.state.sortDirection)
                        }}
                    />
                </div>
            </div>
        );
    }
}