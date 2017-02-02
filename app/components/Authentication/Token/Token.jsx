import React from 'react'
import _ from 'lodash';
import styles from './token.css';
import { red500, orange500, red300, white } from 'material-ui/styles/colors.js'
import RaisedButton from 'material-ui/RaisedButton';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {Toolbar, ToolbarGroup, ToolbarSeparator} from 'material-ui/Toolbar';
import copy from 'copy-to-clipboard';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Dialog from 'material-ui/Dialog';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import LinearProgress from 'material-ui/LinearProgress';
import Snackbar from 'material-ui/Snackbar';
import Checkbox from 'material-ui/Checkbox';
import Toggle from 'material-ui/Toggle';
import Paper from 'material-ui/Paper';
import {List, ListItem} from 'material-ui/List';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import {tokenHasCapabilities, callVaultApi} from '../../shared/VaultUtils.jsx'
import JsonEditor from '../../shared/JsonEditor.jsx';
import UltimatePagination from 'react-ultimate-pagination-material-ui'


export default class TokenAuthBackend extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            loading: false,
            accessorListError: "",
            accessorList: [],
            accessorDetails: {},
            selectedAccessor: '',
            accessorInfoDialog: false,
            revokeConfirmDialog: false,
            revokeAccessorId: '',
            newTokenDialog: false,
            newTokenCodeDialog: false,
            newTokenCode: false,
            newTokenBtnDisabled: true,
            newTokenAvailablePolicies: [],
            newTokenIsOrphan: false,
            newTokenExpires: true,
            newTokenIsRenewable: true,
            canCreateOrphan: '',
            newTokenSelectedPolicies: ['default'],
            newTokenDisplayName: '',
            newTokenMaxUses: 0,
            newTokenOverrideTTL: 0,
            fullAccessorList: [],
            currentPage: 1,
            totalPages: 1,
            maxItemsPerPage: 10,
            revokeBtnDisabled: true,
            snackBarMsg:''
        };
        
        this.styles = {
            chip: {
                margin: '6px 6px 0 0',
                border: '1px solid black',
            }
        };
        
        _.bindAll(
            this,
            'onTotalPagesChange',
            'onPageChangeFromPagination',
            'renderAccessorTableItems',
            'componentDidUpdate',
            'onRowSelection',
            'componentDidMount',
            'updateAccessorList',
            'renderRevokeConfirmDialog',
            'revokeAccessor',
            'renderAccessorInfoDialog',
            'renderNewTokenDialog'
        )
    }
    
    onTotalPagesChange(event) {
       this.setState({totalPages: +event.target.value});
     }

     onPageChangeFromPagination(newPage) {
         this.setState({
             currentPage: newPage,
             accessorList: [],
             selectedAccessor: '',
             revokeBtnDisabled: true,
         });
       
     }

    renderAccessorTableItems() {
        return _.map(this.state.accessorList, (acc_id) => {
            if (acc_id in this.state.accessorDetails) {
                
                let policies = _.map(this.state.accessorDetails[acc_id].policies,(policy) => {
                    if (policy != "default") {
                        return (<ListItem key={policy} className={styles.policiesList} secondaryText={policy} />)
                    }
                });
                
                let getDateStr = (epoch) => {
                    let locale = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage)
                    let d = new Date(0);
                    d.setUTCSeconds(epoch);
                    return d.toLocaleString(locale);
                }
                
                return (
                    <TableRow selected={acc_id == this.state.selectedAccessor} key={acc_id}>
                        <TableRowColumn colSpan="2" >{acc_id}</TableRowColumn>
                        <TableRowColumn>{this.state.accessorDetails[acc_id].display_name}</TableRowColumn>
                        <TableRowColumn><List>{policies}</List></TableRowColumn>
                        <TableRowColumn style={{whiteSpace: 'normal'}}>{getDateStr(this.state.accessorDetails[acc_id].creation_time)}</TableRowColumn>
                        <TableRowColumn style={{width: 40}}>{this.state.accessorDetails[acc_id].orphan &&
                            <FontIcon className="fa fa-check"></FontIcon>
                        }</TableRowColumn>
                    </TableRow>
                )
            } else {
                return (
                    <TableRow selected={acc_id == this.state.selectedAccessor} key={acc_id}>
                        <TableRowColumn colSpan="2" >{acc_id}</TableRowColumn>
                    </TableRow>
                )
            }
        });
    }
    
    componentDidUpdate() {
        if(this.state.fullAccessorList.length > 0 && this.state.accessorList.length == 0) {
            this.updateAccessorList(this.state.currentPage);
        }
    }
    
    updateAccessorList(page) {
        let offset = (page -1) * this.state.maxItemsPerPage;
        let displayedAccessorList = _.slice(
            this.state.fullAccessorList,
            offset,
            offset + this.state.maxItemsPerPage
        )
        
        _.map(displayedAccessorList, ((id) => {
            if(!(id in this.state.accessorDetails)) {
                tokenHasCapabilities(['update'], 'auth/token/lookup-accessor').then(() => {
                    return callVaultApi('post', 'auth/token/lookup-accessor', {}, {accessor: id}).then((resp) => {
                        let current_list = this.state.accessorDetails;
                        current_list[id] = resp.data.data;
                        this.setState({accessorDetails: current_list});
                    });
                }).catch();
            }
        }));

        this.setState({
            accessorList: displayedAccessorList,
        });
    }
    
    onRowSelection(selectedRows) {
        if(selectedRows.length){
            this.setState({selectedAccessor: this.state.accessorList[selectedRows[0]]});
            tokenHasCapabilities(['update'], 'auth/token/revoke-accessor').then(() => {
                this.setState({revokeBtnDisabled: false});
            }).catch(() => {
                this.setState({revokeBtnDisabled: true});
            });
        } else {
            this.setState({
                revokeBtnDisabled: true,
                selectedAccessor: ''
            });
        }
    }

    componentDidMount() {
        
        // Check if user is allowed to create new tokens
        tokenHasCapabilities(['update'], 'auth/token/create')
            .then(() => {
                this.setState({newTokenBtnDisabled: false});
                // Check if user has sudo capability on the path
                return tokenHasCapabilities(['sudo'], 'auth/token/create')
                    .then(() => {
                        // sudo users can use the `no_parent` attribute to create orphan tokens
                        this.setState({'canCreateOrphan': 'no_parent'});
                        // sudo users can assign any policy to a token. load the full list, if possible
                        return tokenHasCapabilities(['read'], 'sys/policy').then(() => {
                            return callVaultApi('get', 'sys/policy').then((resp) => {
                                this.setState({newTokenAvailablePolicies: resp.data.data.keys});
                            });
                        });
                    })
                    .catch(() => {
                        // User doesnt have sudo or policy list failed, either way use user assigned policies
                        let p1 = callVaultApi('get', 'auth/token/lookup-self').then((resp) => {
                            this.setState({newTokenAvailablePolicies: resp.data.data.policies});
                        }).catch(); // <- This shouldnt have failed

                        // Altough sudo was not granted, we could still create orphans using a different endpoint
                        let p2 = tokenHasCapabilities(['update'], 'auth/token/create-orphan').then(() => {
                            // Turns out we can
                            this.setState({'canCreateOrphan': 'create_orphan'});
                        }).catch(); // <- Nothing we can really do at this point

                        return Promise.all([p1,p2]);
                    });
            })
            .catch(() => {
                // Not allowed to create. Disable button
                this.setState({newTokenBtnDisabled: true});
            })
        
        tokenHasCapabilities(['sudo','list'], 'auth/token/accessors')
            .then(() => {
                return callVaultApi('get', 'auth/token/accessors', {'list': true} ).then((resp) => {
                    this.setState({
                        fullAccessorList: resp.data.data.keys,
                        totalPages: Math.ceil(resp.data.data.keys.length/this.state.maxItemsPerPage)
                    });
                });
            })
            .catch(() => {
                this.setState({snackBarMsg: 'You don\' have enough permissions to list accessors'});
            });
    }
    
    revokeAccessor(id) {
        tokenHasCapabilities(['update'], 'auth/token/revoke-accessor').then(() => {
            callVaultApi('post', 'auth/token/revoke-accessor', {}, {accessor: id}).then(() => {
                let list = this.state.accessorList
                list.splice(list.indexOf(id), 1);
                this.setState({
                    accessorList: list,
                    revokeConfirmDialog: false
                });
            });
        });
    }
    
    renderRevokeConfirmDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ revokeConfirmDialog: false, selectedAccessor: '' })} />,
            <FlatButton label="Revoke" style={{ color: white }} hoverColor={red300} backgroundColor={red500} primary={true} onTouchTap={() => this.revokeAccessor(this.state.revokeAccessorId)} />
        ];

        return (
            <Dialog
                title={`Delete Confirmation`}
                modal={false}
                actions={actions}
                open={this.state.revokeConfirmDialog}
                onRequestClose={() => this.setState({ revokeConfirmDialog: false})}
                >
                <p>You are about to permanently delete {this.state.revokeAccessorId}.  Are you sure?</p>
                <em>To disable this prompt, visit the settings page.</em>
            </Dialog>
        )
    }
    
    renderAccessorInfoDialog() {
        const actions = [
            <FlatButton label="Ok" primary={true} keyboardFocused={true} onTouchTap={() => this.setState({accessorInfoDialog: false})} />
        ];

        return (
            <Dialog
                title={`Accessor Details`}
                modal={false}
                actions={actions}
                open={this.state.accessorInfoDialog}
                onRequestClose={() => this.setState({ accessorInfoDialog: false})}
            >
                <JsonEditor
                    rootName={`auth/token/accessors/${this.state.selectedAccessor}`}
                    value={this.state.accessorDetails[this.state.selectedAccessor]}
                    mode={'view'}
                    modes={['view']}
                />
            </Dialog>
        )
    }
    
    renderNewTokenDialog() {

        let handlePoliciesCheckUncheck = (policy, isInputChecked) => {
            if (isInputChecked) {
                this.setState({newTokenSelectedPolicies: _.union(this.state.newTokenSelectedPolicies, [policy])})
            } else {
                this.setState({newTokenSelectedPolicies: _.without(this.state.newTokenSelectedPolicies, policy)})
            }
        };
        
        let handleCreateAction = () => {
            this.setState({loading: true});
            
            let vault_endpoint = 'auth/token/create';

            let params = {
                display_name: this.state.newTokenDisplayName,
                policies: this.state.newTokenSelectedPolicies,
                no_default_policy: (_.indexOf(this.state.newTokenSelectedPolicies, 'default') === -1),
                renewable: this.state.newTokenIsRenewable
            }
            
            if (this.state.newTokenMaxUses) {
                params['num_uses'] = this.state.newTokenMaxUses;
            }

            if (this.state.newTokenOverrideTTL) {
                params['ttl'] = `${this.state.newTokenOverrideTTL}h`;
            }

            if (this.state.newTokenIsOrphan && this.state.canCreateOrphan) {
                if (this.state.canCreateOrphan == 'create_orphan') {
                    // We can create orphans but we need to use the dedicated endpoint
                    vault_endpoint = 'auth/token/create-orphan'
                } else {
                    params['no_parent'] = true
                }
            }

            callVaultApi('post', vault_endpoint, {}, params)
                .then((resp) => {
                    this.setState({
                        loading: false,
                        newTokenCode: resp.data.auth.client_token
                    });
                })
                .catch((error) => {
                    // Despite our efforts, the request failed. show why
                    this.setState({
                        loading: false,
                        snackBarMsg: `Server returned status ${error.response.status}: ${_.join(error.response.data.errors)}`
                    })
                });
        }
        
        const NewTokenDialogAction = [
            <FlatButton label="Cancel" secondary={true} onTouchTap={() => this.setState({ newTokenDialog: false })} />,
            <FlatButton label="Create" disabled={this.state.newTokenCode != ''} primary={true} onTouchTap={handleCreateAction}/>,
            <LinearProgress mode={this.state.loading ? 'indeterminate' : 'determinate'} />
        ];
        
        const NewTokenCodeDialogActions = [
            <FlatButton label="Close" primary={true} onTouchTap={() => this.setState({ newTokenCode: '', newTokenDialog: false })} />
        ];
        
        let policiesItems = this.state.newTokenAvailablePolicies.map((policy, idx) => {
            if ( policy != "default" && policy != "root") {
                return (
                    <ListItem
                        key={idx}
                        leftCheckbox={<Checkbox onCheck={(e,iic) => {handlePoliciesCheckUncheck(policy, iic)}}/>}
                        primaryText={policy}
                    />
                )
            }
        });

        return (
            <div>
            <Dialog
                title="New Token"
                autoScrollBodyContent={true}
                modal={false}
                actions={NewTokenDialogAction}
                open={this.state.newTokenDialog}
                onRequestClose={() => this.setState({ newTokenDialog: false})}
                >
                <Divider />
                    <TextField
                        className={styles.textFieldStyle}
                        hintText="Give this token a name"
                        floatingLabelFixed={true}
                        floatingLabelText="Token display name"
                        fullWidth={false}
                        onChange={(e) => {this.setState({newTokenDisplayName: e.target.value})}}
                        autoFocus
                    />
                    <TextField
                        className={styles.textFieldStyle}
                        hintText="Leave blank or 0 for infinite"
                        floatingLabelFixed={true}
                        type="number"
                        floatingLabelText="Maximum number of uses"
                        fullWidth={false}
                        onChange={(e) => {this.setState({newTokenMaxUses:  Math.max(0,Number(e.target.value))})}}
                    />
                    <TextField
                        className={styles.textFieldStyle}
                        hintText="Enter the TTL in hours"
                        floatingLabelFixed={true}
                        type="number"
                        floatingLabelText="Override TTL"
                        fullWidth={false}
                        onChange={(e) => {this.setState({newTokenOverrideTTL: Math.max(0,Number(e.target.value))})}}
                    />
                    <List>
                        <Subheader>Settings</Subheader>
                        <ListItem
                            rightToggle={
                                <Toggle
                                    disabled={this.state.canCreateOrphan == ''}
                                    onToggle={(e,v) => this.setState({newTokenIsOrphan: v}) }
                                />
                            }
                            primaryText="Orphan Token"
                        />
                        <ListItem
                            rightToggle={
                                <Toggle
                                    defaultToggled={true}
                                    onToggle={(e,v) => handlePoliciesCheckUncheck('default', v) }
                                />
                            }
                            primaryText="Default Policy"
                        />
                        <ListItem
                            rightToggle={
                                <Toggle
                                    defaultToggled={this.state.newTokenIsRenewable}
                                    onToggle={(e,v) => this.setState({newTokenIsRenewable: v}) }
                                />
                            }
                            primaryText="Renewable"
                        />
                    </List>
                    <List>
                        <Subheader>Assign Additional Policies</Subheader>
                        {policiesItems}
                    </List>
                    
            </Dialog>
                <Dialog
                    title="Token created!"
                    modal={true}
                    open={this.state.newTokenCode != ''}
                    actions={NewTokenCodeDialogActions}
                    >
                    
                    <div className={styles.newTokenCodeEmitted}>
                        <TextField
                            fullWidth={true}
                            disabled={true}
                            floatingLabelText="New token code"
                            errorText="This is the last chance to save this token. Once you close the dialog you won't be able to retrieve it"
                            errorStyle={{color: orange500,}}
                            defaultValue={this.state.newTokenCode}
                        />
                        <RaisedButton icon={<FontIcon className="fa fa-clipboard"/>} label="Copy to Clipboard" onTouchTap={() => { copy(this.state.newTokenCode) }} />
                    </div>
                </Dialog>
            </div>
        )
    }

    render() {
        return (
            <div>
                {this.renderRevokeConfirmDialog()}
                {this.renderAccessorInfoDialog()}
                {this.renderNewTokenDialog()}
                <h1 id={styles.welcomeHeadline}>Tokens</h1>
                <h2>Manage Tokens</h2>
                <p>Here you can do stuff with tokens</p>
                <Paper>
                    <Toolbar>
                        <ToolbarGroup firstChild={true}>
                            <FlatButton
                                primary={true}
                                label="NEW TOKEN"
                                disabled={this.state.newTokenBtnDisabled}
                                onTouchTap={() => {this.setState({
                                    newTokenDialog: true,
                                    newTokenCodeDialog: false,
                                    newTokenCode: '',
                                    newTokenSelectedPolicies: ['default'],
                                    newTokenIsOrphan: false,
                                    newTokenIsRenewable: true,
                                    newTokenMaxUses: 0,
                                    newTokenOverrideTTL: 0
                                })}}
                            />
                        </ToolbarGroup>
                        <ToolbarGroup>
                                <ToolbarSeparator />
                                <IconMenu iconButtonElement={<IconButton iconClassName="fa fa-bars"/>}>
                                    <MenuItem
                                        primaryText="Show details"
                                        disabled={!this.state.selectedAccessor}
                                        onTouchTap={() => this.setState({accessorInfoDialog: true})}
                                    />
                                    <Divider />
                                    <MenuItem
                                        primaryText="Revoke Selected"
                                        disabled={this.state.revokeBtnDisabled}
                                        onTouchTap={() => {
                                            this.setState({ revokeConfirmDialog: true, revokeAccessorId: this.state.selectedAccessor })
                                        } }
                                    />
                                </IconMenu>    
                            </ToolbarGroup>
                        </Toolbar>
                    <Table selectable={true} onRowSelection={this.onRowSelection}>
                        <TableHeader displaySelectAll={false} adjustForCheckbox={true}>
                            <TableRow>
                                <TableHeaderColumn colSpan="2" >Accessor ID</TableHeaderColumn>
                                <TableHeaderColumn>Display Name</TableHeaderColumn>
                                <TableHeaderColumn>Additional Policies</TableHeaderColumn>
                                <TableHeaderColumn>Created</TableHeaderColumn>
                                <TableHeaderColumn style={{width: 40}}>Orphan</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody showRowHover={true} displayRowCheckbox={true} stripedRows={true} deselectOnClickaway={false}>
                            {this.renderAccessorTableItems()}
                        </TableBody>
                        <TableFooter adjustForCheckbox={false}>
                            <TableRow>
                                <TableRowColumn style={{textAlign: 'center'}} colSpan="4">
                                    <UltimatePagination
                                        currentPage={this.state.currentPage}
                                        totalPages={this.state.totalPages}
                                        onChange={this.onPageChangeFromPagination}
                                    />
                                </TableRowColumn>
                            </TableRow>
                        </TableFooter>    
                    </Table>
                </Paper>
                <Snackbar
                    open={this.state.snackBarMsg != ''}
                    message={this.state.snackBarMsg}
                    action="OK"
                    onActionTouchTap={() => this.setState({snackBarMsg: ''})}
                    autoHideDuration={4000}
                    onRequestClose={() => this.setState({snackBarMsg: ''})}
                />
            </div>
        );
    }
}
