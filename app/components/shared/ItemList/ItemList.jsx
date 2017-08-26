import React, { PropTypes } from 'react';
import Avatar from 'material-ui/Avatar';

import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import ActionAccountBox from 'material-ui/svg-icons/action/account-box';
import IconButton from 'material-ui/IconButton';

import { List, ListItem } from 'material-ui/List';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';  
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import sharedStyles from '../../shared/styles.css';
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
        maxItemsPerPage: PropTypes.number.isRequired,
        onTouchTap: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        this.itemUri = this.props.itemUri;
        this.maxItemsPerPage = this.props.maxItemsPerPage;
        this.itemListFull = [];
        this.filteredItemList = [];

        this.state = {
            // itemListFull: this.props.itemList,
            // filteredItemList: this.props.itemList,
            pageItems: [],
            parsedItems: [],
            filterString: '',
            sortDirection: SORT_DIR.ASC,
            currentPage: 1,
            totalPages: 1,
        };

        _.bindAll(
            this,
            'renderItemList',
            'setPage'
        );
    }


    renderItemList() {
        return _.map(this.state.pageItems, (item) => {
            let avatar = (<Avatar icon={<ActionAccountBox />} />);
            let action = (
                <IconButton
                    tooltip='Delete'
                    onTouchTap={() => this.setState({ deleteUserPath: `${this.itemUri}/${item}` })}
                >
                    {window.localStorage.getItem('showDeleteModal') === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                </IconButton>
            );

            return (
                <ListItem
                    key={item}
                    primaryText={item}
                    insetChildren={true}
                    leftAvatar={avatar}
                    rightIconButton={action}
                    onTouchTap={this.props.onTouchTap.bind(null, item)}
                />
            )
        });
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

    setPage(page, sortDirection) {
        let maxPage = Math.ceil(this.filteredItemList.length / this.state.maxItemsPerPage);
        // Never allow to set to higher page than max
        page = page > maxPage ? maxPage : page
        // Never allow a 0th or negative page
        page = page <= 0 ? 1 : page;

        sortDirection = sortDirection ? sortDirection : this.state.secretSortDir;
        let sortedItems = _.orderBy(this.filteredItemList, _.identity, sortDirection);
        let parsedItems = _.chunk(sortedItems, this.maxItemsPerPage);
        this.setState(
            {
                currentPage: page,
                totalPages: Math.ceil(sortedItems.length / this.maxItemsPerPage),
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
        this.setPage(1, 'Ascending');
    }

    componentWillReceiveProps(nextProps) {
        this.itemListFull = nextProps.itemList;
        this.filterItems(this.state.filterString);
        this.setPage(1, 'Ascending');
    }

    render() {
        return (
            <div>
                <Toolbar>
                    <ToolbarGroup lastChild={true}>
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelText="Filter"
                            hintText="Filter items"
                            value={this.state.filterString}
                            onChange={(e, v) => {
                                this.setState({ filterString: v });
                                this.filterItems(v);
                                this.setPage(this.state.currentPage, this.state.sortDirection)
                            }}
                        />
                        <SelectField
                            style={{ width: 150 }}
                            autoWidth={true}
                            floatingLabelText="Sort Items"
                            floatingLabelFixed={true}
                            value={this.state.sortDirection}
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
                    {this.renderItemList()}
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