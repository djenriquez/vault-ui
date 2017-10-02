import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'material-ui/Tabs';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import { List } from 'material-ui/List';
import { Step, Stepper, StepLabel } from 'material-ui/Stepper';
import sharedStyles from '../../shared/styles.css';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import { green500, green400, white } from 'material-ui/styles/colors.js'
import { callVaultApi, tokenHasCapabilities, history } from '../../shared/VaultUtils.jsx'
import JsonEditor from '../../shared/JsonEditor.jsx';
import SecretWrapper from '../../shared/Wrapping/Wrapper.jsx'
import { Link } from 'react-router'
import ItemList from '../../shared/ItemList/ItemList.jsx';
import copy from 'copy-to-clipboard';
import ContentContentCopy from 'material-ui/svg-icons/content/content-copy';
import IconButton from 'material-ui/IconButton';

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class GenericSecretBackend extends React.Component {
    static propTypes = {
        params: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);

        this.baseUrl = `/secrets/${this.props.params.namespace}/`;
        this.baseVaultPath = `${this.props.params.splat}`;

        this.state = {
            newSecretBtnDisabled: true,
            secretContent: {},
            newSecretName: '',
            currentLogicalPath: `${this.props.params.splat}`,
            disableSubmit: true,
            openNewObjectModal: false,
            openEditObjectModal: false,
            useRootKey: window.localStorage.getItem("useRootKey") === 'true' || false,
            rootKey: window.localStorage.getItem("secretsRootKey") || '',
            secretList: [],
        }

        _.bindAll(
            this,
            'secretChangedJsonEditor',
            'secretChangedTextEditor',
            'loadSecretsList',
            'displaySecret',
            'CreateUpdateObject',
            'renderNewObjectDialog',
            'renderEditObjectDialog'
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
                        let secrets = _.get(resp, 'data.data.keys', []);
                        this.setState({ secretList: secrets });
                    })
                    .catch((err) => {
                        // 404 is expected when no secrets are present
                        if (!_.has(err, 'response') || err.response.status != 404)
                            snackBarMessage(err)
                        else {
                            this.setState({ secretList: [] });
                        }
                    })
            })
            .catch(() => {
                this.setState({ secretList: [] })
                snackBarMessage(new Error(`No permissions to list content at ${this.state.currentLogicalPath}`));
            })
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

    componentDidMount() {
        if (this.isPathDirectory(this.props.params.splat)) {
            this.loadSecretsList();
        } else {
            this.displaySecret();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(`${nextProps.params.splat}`, this.state.currentLogicalPath)) {
            this.setState({ currentLogicalPath: `${nextProps.params.splat}` })
        }
        if (!_.isEqual(this.props.params.namespace, nextProps.params.namespace)) {
            this.baseUrl = `/secrets/${nextProps.params.namespace}/`;
        }
        if (!_.isEqual(this.props.params.splat, nextProps.params.splat)) {
            // Reset
            this.setState({
                secretList: []
            })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!_.isEqual(this.props.params, prevProps.params)) {
            if (this.isPathDirectory(this.props.params.splat)) {
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


    renderNewObjectDialog() {
        const MISSING_KEY_ERROR = "Key cannot be empty.";
        const DUPLICATE_KEY_ERROR = `Key '${this.state.currentLogicalPath}${this.state.newSecretName}' already exists.`;

        let validateAndSubmit = () => {
            if (this.state.newSecretName === '') {
                snackBarMessage(new Error(MISSING_KEY_ERROR));
                return;
            }

            if (_.filter(this.state.secretList, x => x === this.state.newSecretName).length > 0) {
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

    render() {
        let renderBreadcrumb = () => {
            let components = _.initial(this.getBaseDir(this.state.currentLogicalPath).split('/'));
            return _.map(components, (dir, index) => {
                var relativelink = [].concat(components).slice(0, index + 1).join('/') + '/';
                if (index === 0) {
                    // no left padding for first item
                    var stepLabelStyle = { paddingLeft: '0' }
                    var iconContainerStyle = { padding: '0' }
                } else {
                    var stepLabelStyle = { paddingLeft: '10px' }
                    var iconContainerStyle = {}
                }
                return (<Step key={index}><StepLabel style={Object.assign({ paddingRight: '10px', fontSize: '16px', whiteSpace: 'nowrap' }, stepLabelStyle)} iconContainerStyle={iconContainerStyle} icon={<span />}><Link to={`${this.baseUrl}${relativelink}`}>{dir}</Link></StepLabel></Step>)
            });
        }


        return (
            <div>
                {this.renderEditObjectDialog()}
                {this.renderNewObjectDialog()}
                <Tabs>
                    <Tab label="Browse Secrets" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can browse, edit, create and delete secrets.
                        </Paper>
                        <Paper zDepth={0}>
                            <Toolbar style={{ alignItems: 'flex-start' }}>
                                <ToolbarGroup>
                                    <Subheader style={{ paddingLeft: "0" }} inset={false}>
                                        <IconButton style={{ paddingTop: "20px" }} tooltip="Copy Path" onTouchTap={() => { copy(this.state.currentLogicalPath) }} >
                                            <ContentContentCopy />
                                        </IconButton>
                                    </Subheader>
                                    <Subheader style={{ paddingLeft: "10px" }} inset={false}>
                                        <Stepper
                                            style={{ justifyContent: 'flex-start', fontWeight: 600 }}
                                            linear={false}
                                            connector={<span>/</span>}
                                        >
                                            {renderBreadcrumb()}
                                        </Stepper>
                                    </Subheader>
                                </ToolbarGroup>
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

                            </Toolbar>
                            <ItemList
                                itemList={this.state.secretList}
                                itemUri={`${this.state.currentLogicalPath.substring(0, this.state.currentLogicalPath.length - 1)}`}
                                maxItemsPerPage={25}
                                onDeleteTap={(deletedItem) => {
                                    let secrets = _.clone(this.state.secretList);
                                    let secretToDelete = _.find(secrets, (secretToDelete) => { return secretToDelete == deletedItem; });
                                    secrets = _.pull(secrets, secretToDelete);
                                    console.log(secrets);
                                    this.setState({
                                        secretList: secrets
                                    });
                                    this.loadSecretsList();
                                    snackBarMessage(`Secret ${deletedItem} deleted`);
                                }}
                                onTouchTap={(key) => {
                                    tokenHasCapabilities([this.isPathDirectory(key) ? 'list' : 'read'], `${this.state.currentLogicalPath}${key}`)
                                        .then(() => {
                                            this.setState({ newSecretName: '', currentLogicalPath: `${this.state.currentLogicalPath}${key}` });
                                            history.push(`${this.baseUrl}${this.state.currentLogicalPath}`);
                                        }).catch(() => {
                                            snackBarMessage(new Error("Access denied"));
                                        })
                                }}
                            />
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}