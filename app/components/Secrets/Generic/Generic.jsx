import React, { PropTypes } from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import Avatar from 'material-ui/Avatar';
import FileFolder from 'material-ui/svg-icons/file/folder';
import ActionAssignment from 'material-ui/svg-icons/action/assignment';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem'
import { List, ListItem } from 'material-ui/List';
import { Step, Stepper, StepLabel } from 'material-ui/Stepper';
import sharedStyles from '../../shared/styles.css';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import { green500, green400, red500, red300, white } from 'material-ui/styles/colors.js'
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx'
import JsonEditor from '../../shared/JsonEditor.jsx';
import SecretWrapper from '../../shared/Wrapping/Wrapper.jsx'
import { Link } from 'react-router'
import UltimatePagination from 'react-ultimate-pagination-material-ui'

const SORT_DIR = {
    ASC: 'asc',
    DESC: 'desc'
};

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

class GenericSecretBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            newSecretBtnDisabled: true,
            secretSortDir: SORT_DIR.ASC,
            secretList: [],
            filteredSecretList: [],
            secretContent: {},
            newSecretName: '',
            currentLogicalPath: '',
            disableSubmit: true,
            openNewObjectModal: false,
            openEditObjectModal: false,
            openDeleteModal: false,
            deletingKey: '',
            wrapPath: null,
            useRootKey: window.localStorage.getItem("useRootKey") === 'true' || false,
            rootKey: window.localStorage.getItem("secretsRootKey") || '',
            fullSecretList: [],
            maxItemsPerPage: 25,
            currentPage: 1,
            totalPages: 1,
            filterString: "",
            pagedSecrets: [],
            clickedSecret: ""
        }

        _.bindAll(
            this,
            'secretChangedJsonEditor',
            'secretChangedTextEditor',
            'loadSecretsList',
            'displaySecret',
            'CreateUpdateObject',
            'DeleteObject',
            'renderNewObjectDialog',
            'renderEditObjectDialog',
            'renderDeleteConfirmationDialog',
            'setPage',
            'setNewMaxItems',
            'resetPage'
        );
    }

    isPathDirectory(path) {
        if (!path) path = '/';
        return (path[path.length - 1] === '/');
    }

    getBaseDir(path) {
        if (!path) return '/';
        return path.substring(0, _.lastIndexOf(path, '/') + 1);
    }

    loadSecretsList(prevProps) {
        // Control the new secret button
        tokenHasCapabilities(['create'], this.state.currentLogicalPath)
            .then(() => {
                this.setState({ newSecretBtnDisabled: false })
            })
            .catch(() => {
                this.setState({ newSecretBtnDisabled: true })
            })

        tokenHasCapabilities(['list'], this.state.currentLogicalPath)
            .then(() => {
                // Load secret list at current path
                callVaultApi('get', this.state.currentLogicalPath, { list: true }, null, null)
                    .then((resp) => {
                        let secretList = resp.data.data.keys
                        this.setState({ fullSecretList: secretList });

                        // Load to the page with the secret directed to
                        let page = this.state.currentPage;
                        if (prevProps && prevProps.params.splat) {
                            let filtered = this.state.filterString ? _.filter(secretList, (item) => { return item.toLowerCase().includes(this.state.filterString.toLowerCase()); }) : secretList;
                            let _pagedSecrets = _.chunk(filtered, this.state.maxItemsPerPage);
                            page = _.findIndex(_pagedSecrets, (secret) => { return _.indexOf(secret, this.state.clickedSecret) >= 0 }) + 1;
                        }
                        this.setPage(page, secretList, this.state.sortDirection, this.state.filterString);
                    })
                    .catch((err) => {
                        // 404 is expected when no secrets are present
                        if (!_.has(err, 'response') || err.response.status != 404)
                            snackBarMessage(err)
                    })
            })
            .catch(() => {
                this.setState({ fullSecretList: [], secretList: [], filteredSecretList: [] })
                snackBarMessage(new Error(`No permissions to list content at ${this.state.currentLogicalPath}`));
            })
    }

    setPage(page, secretList, sortDirection, filterString) {

        let filtered = filterString ? _.filter(secretList, (item) => { return item.toLowerCase().includes(filterString.toLowerCase()); }) : secretList;
        let maxPage = Math.ceil(filtered.length / this.state.maxItemsPerPage);
        // Never allow to set to higher page than max
        page = page > maxPage ? maxPage : page
        // Never allow a 0th or negative page
        page = page <= 0 ? 1 : page;
        sortDirection = sortDirection ? sortDirection : this.state.secretSortDir;
        let sortedSecrets = _.orderBy(filtered, _.identity, sortDirection);
        let _pagedSecrets = _.chunk(sortedSecrets, this.state.maxItemsPerPage);
        this.setState(
            {
                secretSortDir: sortDirection,
                filteredSecretList: sortedSecrets,
                currentPage: page,
                totalPages: Math.ceil(sortedSecrets.length / this.state.maxItemsPerPage),
                pagedSecrets: _pagedSecrets,
                secretList: _pagedSecrets[page - 1]
            });
    }

    resetPage() {
        this.setState({
            currentPage: 1
        });
    }

    //TODO: Incase we add functionality to allow users to modify maximum secrets on screen
    setNewMaxItems(maxItems) {
        let _pagedSecrets = _.chunk(this.state.filteredSecretList, maxItems);
        let _maxPage = Math.ceil(this.state.filteredSecretList.length / maxItems);
        let _currentPage = this.state.currentPage > _maxPage ? _maxPage : this.state.currentPage;

        this.setState(
            {
                maxItemsPerPage: maxItems,
                totalPages: _maxPage,
                pagedSecrets: _pagedSecrets,
                currentPage: _currentPage,
                secretList: _pagedSecrets[_currentPage - 1]
            }
        )
    }

    displaySecret() {
        tokenHasCapabilities(['read'], this.state.currentLogicalPath)
            .then(() => {
                // Load content of the secret
                callVaultApi('get', this.state.currentLogicalPath, null, null, null)
                    .then((resp) => {
                        this.setState({ secretContent: resp.data.data, openEditObjectModal: true });
                    })
                    .catch(snackBarMessage)
            })
            .catch(() => {
                this.setState({ secretContent: {} })
                snackBarMessage(new Error(`No permissions to read content of ${this.state.currentLogicalPath}`));
            })
    }

    componentWillMount() {
        this.setState({ currentLogicalPath: `${this.props.params.namespace}/${this.props.params.splat}` })
    }

    componentDidMount() {
        if (this.isPathDirectory(this.props.params.splat)) {
            this.loadSecretsList();
        } else {
            this.displaySecret();
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ currentLogicalPath: `${nextProps.params.namespace}/${nextProps.params.splat}` })
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            // Reset
            this.setState({
                secretList: [],
                filteredSecretList: [],
                fullSecretList: [],
                currentPage: 1,
                clickedSecret: ''
            })
        }
    }

    componentDidUpdate(prevProps) {
        if (!_.isEqual(this.props.params, prevProps.params)) {
            if (this.isPathDirectory(this.props.params.splat)) {
                this.resetPage();
                this.loadSecretsList(prevProps);
            } else {
                this.displaySecret();
            }
        }
    }

    secretChangedJsonEditor(v, syntaxCheckOk) {
        if (syntaxCheckOk && v) {
            this.setState({ disableSubmit: false, secretContent: v });
        } else {
            this.setState({ disableSubmit: true });
        }
    }

    secretChangedTextEditor(e, v) {
        this.setState({ disableSubmit: false });
        let tmp = {};
        _.set(tmp, `${this.state.rootKey}`, v);
        this.setState({ secretContent: tmp });
    }

    CreateUpdateObject() {
        let secret = this.state.secretContent;
        let fullpath = this.state.currentLogicalPath + this.state.newSecretName;
        callVaultApi('post', fullpath, null, secret, null)
            .then(() => {
                if (this.state.newSecretName) {
                    this.loadSecretsList();
                    snackBarMessage(`Secret ${fullpath} added`);
                } else {
                    snackBarMessage(`Secret ${fullpath} updated`);
                }
            })
            .catch(snackBarMessage)
    }

    DeleteObject(key) {
        let fullpath = this.state.currentLogicalPath + key;
        callVaultApi('delete', fullpath, null, null, null)
            .then(() => {
                let secrets = this.state.secretList;
                let secretToDelete = _.find(secrets, (secretToDelete) => { return secretToDelete == key; });
                secrets = _.pull(secrets, secretToDelete);
                this.setState({
                    secretList: secrets,
                });
                snackBarMessage(`Secret ${fullpath} deleted`);
            })
            .catch(snackBarMessage)
    }


    renderNewObjectDialog() {
        const MISSING_KEY_ERROR = "Key cannot be empty.";
        const DUPLICATE_KEY_ERROR = `Key '${this.state.currentLogicalPath}${this.state.newSecretName}' already exists.`;

        let validateAndSubmit = () => {
            if (this.state.newSecretName === '') {
                snackBarMessage(new Error(MISSING_KEY_ERROR));
                return;
            }

            if (_.filter(this.state.fullSecretList, x => x === this.state.newSecretName).length > 0) {
                snackBarMessage(new Error(DUPLICATE_KEY_ERROR));
                return;
            }
            this.CreateUpdateObject();
            this.setState({ openNewObjectModal: false });
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openNewObjectModal: false, secretContent: '' })} />,
            <FlatButton label="Save" disabled={this.state.disableSubmit} primary={true} onTouchTap={validateAndSubmit} />
        ];

        var rootKeyInfo;
        var content;

        if (this.state.useRootKey) {
            rootKeyInfo = "Current Root Key: " + this.state.rootKey;
            content = (
                <TextField
                    name="newValue"
                    multiLine={true}
                    fullWidth={true}
                    hintText="Value"
                    autoFocus
                    onChange={this.secretChangedTextEditor}
                />
            );
        } else {
            content = (
                <JsonEditor
                    height={'400px'}
                    rootName={`${this.state.currentLogicalPath}${this.state.newSecretName}`}
                    mode={'tree'}
                    onChange={this.secretChangedJsonEditor}
                />
            );
        }

        return (
            <Dialog
                title={`Create new secret`}
                modal={false}
                onRequestClose={() => { this.setState({ openNewObjectModal: false, secretContent: '' }) }}
                actions={actions}
                open={this.state.openNewObjectModal}
                autoScrollBodyContent={true}
            >
                <TextField name="newKey" autoFocus fullWidth={true} hintText="Insert object key" onChange={(e, v) => this.setState({ newSecretName: v })} />
                {content}
                <div>{rootKeyInfo}</div>
            </Dialog>
        );
    }

    renderEditObjectDialog() {
        const actions = [
            <SecretWrapper buttonLabel="Wrap Secret" path={this.state.currentLogicalPath} />,
            <FlatButton label="Cancel" primary={true} onTouchTap={() => {
                this.setState({ openEditObjectModal: false, secretContent: '' });
                history.push(this.getBaseDir(this.props.location.pathname));
            }
            } />,
            <FlatButton label="Save" disabled={this.state.disableSubmit} primary={true} onTouchTap={() => submitUpdate()} />
        ];

        let submitUpdate = () => {
            this.CreateUpdateObject();
            this.setState({ openEditObjectModal: false, secretContent: '' });
            history.push(this.getBaseDir(this.props.location.pathname));
        }

        var objectIsBasicRootKey = _.size(this.state.secretContent) == 1 && this.state.secretContent.hasOwnProperty(this.state.rootKey);
        var content;
        var title;

        if (objectIsBasicRootKey && this.state.useRootKey) {
            title = `Editing ${this.state.currentLogicalPath} with specified root key`;
            content = (
                <TextField
                    onChange={this.secretChangedTextEditor}
                    name="editingText"
                    autoFocus
                    multiLine={true}
                    defaultValue={this.state.secretContent[this.state.rootKey]}
                    fullWidth={true}
                />
            );
        } else {
            title = `Editing ${this.state.currentLogicalPath}`;
            content = (
                <JsonEditor
                    height={'500px'}
                    rootName={this.state.currentLogicalPath}
                    value={this.state.secretContent}
                    mode={'tree'}
                    onChange={this.secretChangedJsonEditor}
                />
            );
        }
        return (
            <Dialog
                title={title}
                modal={false}
                actions={actions}
                open={this.state.openEditObjectModal}
                autoDetectWindowHeight={true}
                autoScrollBodyContent={true}
                onRequestClose={() => {
                    this.setState({ openEditObjectModal: false, secretContent: '' })
                    history.push(this.getBaseDir(this.props.location.pathname))
                }}
            >
                {content}
            </Dialog>
        );
    }

    renderDeleteConfirmationDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openDeleteModal: false, deletingKey: '' })} />,
            <FlatButton label="Delete" style={{ color: white }} hoverColor={red300} backgroundColor={red500} primary={true} onTouchTap={() => submitDelete()} />
        ];

        let submitDelete = () => {
            this.DeleteObject(this.state.deletingKey);
            this.setState({ openDeleteModal: false });
        }

        return (
            <Dialog
                title={`Delete Confirmation`}
                modal={false}
                actions={actions}
                open={this.state.openDeleteModal}
            >

                <p>You are about to permanently delete {this.state.currentLogicalPath}{this.state.deletingKey}.  Are you sure?</p>
                <em>To disable this prompt, visit the settings page.</em>
            </Dialog>
        )
    }



    render() {
        let renderSecretListItems = (returndirs, returnobjs) => {
            return _.map(this.state.secretList, (key) => {
                let avatar = (<Avatar icon={<ActionAssignment />} />);
                let action = (
                    <IconButton
                        tooltip="Delete"
                        onTouchTap={() => {
                            tokenHasCapabilities(['delete'], this.state.currentLogicalPath + key).then(() => {
                                if (window.localStorage.getItem("showDeleteModal") === 'false') {
                                    this.DeleteObject(key);
                                } else {
                                    this.setState({ openDeleteModal: true, deletingKey: key })
                                }
                            }).catch(() => {
                                snackBarMessage(new Error("Access denied"));
                            })
                        }}
                    >
                        {window.localStorage.getItem("showDeleteModal") === 'false' ? <ActionDeleteForever color={red500} /> : <ActionDelete color={red500} />}
                    </IconButton>
                );
                let capability = 'read';

                if (this.isPathDirectory(key)) {
                    avatar = (<Avatar icon={<FileFolder />} />);
                    action = (<IconButton />);
                    capability = 'list';
                }

                let item = (
                    <ListItem
                        key={key}
                        primaryText={key}
                        insetChildren={true}
                        leftAvatar={avatar}
                        rightIconButton={action}
                        onTouchTap={() => {
                            this.setState({ newSecretName: '' , clickedSecret: key});
                            tokenHasCapabilities([capability], this.state.currentLogicalPath + key).then(() => {
                                history.push(`/secrets/generic/${this.state.currentLogicalPath}${key}`);
                            }).catch(() => {
                                snackBarMessage(new Error("Access denied"));
                            })

                        }}
                    />
                )
                if (this.isPathDirectory(key) && returndirs) { return item }
                if (!this.isPathDirectory(key) && returnobjs) { return item }
            });
        }

        let renderBreadcrumb = () => {
            let components = _.initial(this.getBaseDir(this.state.currentLogicalPath).split('/'));
            return _.map(components, (dir, index) => {
                var relativelink = [].concat(components).slice(0, index + 1).join('/') + '/';
                return (<Step key={index}><StepLabel style={{ paddingLeft: '5px', paddingRight: '5px' }} icon={<span />}><Link to={`/secrets/generic/${relativelink}`}>{dir}</Link></StepLabel></Step>)
            });
        }

        return (
            <div>
                {this.renderEditObjectDialog()}
                {this.renderNewObjectDialog()}
                {this.renderDeleteConfirmationDialog()}
                <Tabs>
                    <Tab label="Browse Secrets" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can browse, edit, create and delete secrets.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <Toolbar>
                                <ToolbarGroup firstChild={true}>
                                    <FlatButton
                                        primary={true}
                                        label="NEW SECRET"
                                        disabled={this.state.newSecretBtnDisabled}
                                        backgroundColor={green500}
                                        hoverColor={green400}
                                        labelStyle={{ color: white }}
                                        onTouchTap={() => {
                                            this.setState({
                                                openNewObjectModal: true,
                                                newSecretName: '',
                                                secretContent: ''
                                            })
                                        }}
                                    />
                                </ToolbarGroup>
                                <ToolbarGroup lastChild={true}>
                                    <TextField
                                        floatingLabelFixed={true}
                                        floatingLabelText="Filter"
                                        hintText="Filter list items"
                                        value={this.state.filterString}
                                        onChange={(e,v) => {
                                            this.setState({ filterString: v });
                                            this.setPage(this.state.currentPage, this.state.fullSecretList, this.state.secretSortDir, v)
                                        }}
                                    />
                                    <SelectField
                                        style={{ width: 150 }}
                                        autoWidth={true}
                                        floatingLabelText="Sort Secrets"
                                        floatingLabelFixed={true}
                                        value={this.state.secretSortDir}
                                        onChange={(e, i, v) => {
                                            this.setPage(this.state.currentPage, this.state.filteredSecretList, v, this.state.filterString);
                                        }}
                                    >
                                        <MenuItem value={SORT_DIR.ASC} primaryText="Ascending" />
                                        <MenuItem value={SORT_DIR.DESC} primaryText="Descending" />
                                    </SelectField>
                                </ToolbarGroup>
                            </Toolbar>
                            <List className={sharedStyles.listStyle}>
                                <Subheader inset={false}>
                                    <Stepper
                                        style={{ justifyContent: 'flex-start', textTransform: 'uppercase', fontWeight: 600 }}
                                        linear={false}
                                        connector={<span>/</span>}
                                    >
                                        {renderBreadcrumb()}
                                    </Stepper>
                                </Subheader>
                                <Divider inset={false} />
                                {renderSecretListItems(true, false)}
                                <Divider inset={true} />
                                {renderSecretListItems(false, true)}
                            </List>
                            <div className={sharedStyles.centered}>
                                <UltimatePagination
                                    currentPage={this.state.currentPage}
                                    totalPages={this.state.totalPages}
                                    onChange={(e) => { this.setPage(e, this.state.filteredSecretList, this.state.sortDirection, this.state.filterString) }}
                                />
                            </div>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}

export default GenericSecretBackend;