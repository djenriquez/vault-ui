import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import { List, ListItem } from 'material-ui/List';
import Edit from 'material-ui/svg-icons/editor/mode-edit';
import Copy from 'material-ui/svg-icons/action/assignment';
import Checkbox from 'material-ui/Checkbox';
import styles from './secrets.css';
import _ from 'lodash';
import copy from 'copy-to-clipboard';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js'
import axios from 'axios';
import JsonEditor from '../shared/JsonEditor.jsx';

const copyEvent = new CustomEvent("snackbar", {
    detail: {
        message: 'Copied!'
    }
});

class Secrets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openEditModal: false,
            openNewKeyModal: false,
            errorMessage: '',
            openDeleteModal: false,
            disableSubmit: false,
            disableTextField: false,
            focusKey: '',
            focusSecret: '',
            listBackends: false,
            secretBackends: [],
            secrets: [],
            namespace: '/secret/',
            useRootKey: window.localStorage.getItem("useRootKey") === 'true' || false,
            rootKey: window.localStorage.getItem("secretsRootKey") || '',
            disableAddButton: false,
            buttonColor: 'lightgrey'
        };

        _.bindAll(
            this,
            'listSecretBackends',
            'getSecrets',
            'renderList',
            'renderNamespace',
            'clickSecret',
            'secretChangedTextEditor',
            'secretChangedJsonEditor',
            'updateSecret',
            'renderEditDialog',
            'renderNewKeyDialog',
            'renderDeleteConfirmationDialog',
            'copyText',
            'deleteKey'
        );
    }

    componentWillMount() {
        this.listSecretBackends();
        this.getSecrets(this.state.namespace);
    }

    copyText(value) {
        copy(value);
        document.dispatchEvent(copyEvent);
    }

    deleteKey(key) {
        let fullKey = `${this.state.namespace}${key}`;
        axios.delete(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                if (resp.status !== 204) {
                    console.error(resp.status);
                } else {
                    let secrets = this.state.secrets;
                    let secretToDelete = _.find(secrets, (secretToDelete) => { return secretToDelete.key == key; });
                    secrets = _.pull(secrets, secretToDelete);
                    this.setState({
                        secrets: secrets
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
            });

        this.setState({
            deletingKey: '',
            openDeleteModal: false
        });
    }

    updateSecret(isNewKey) {
        let fullKey = `${this.state.namespace}${this.state.focusKey}`;
        //Check if the secret is a json object, if so stringify it. This is needed to properly escape characters.
        let secret = typeof this.state.focusSecret == 'object' ? JSON.stringify(this.state.focusSecret) : this.state.focusSecret;

        axios.post(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "VaultUrl": window.localStorage.getItem("vaultUrl"), "Value": secret })
            .then((resp) => {
                if (isNewKey) {
                    let secrets = this.state.secrets;
                    let key = this.state.focusKey.includes('/') ? `${this.state.focusKey.split('/')[0]}/` : this.state.focusKey;
                    secrets.push({ key: key, value: this.state.focusSecret });
                    this.setState({
                        secrets: secrets
                    });
                }
            })
            .catch((err) => {
                console.error(err.stack);
            })
    }

    secretChangedJsonEditor(v, syntaxCheckOk) {
        if (syntaxCheckOk && v) {
            this.setState({disableSubmit: false, focusSecret: v});
        } else {
            this.setState({disableSubmit: true});
        }
    }

    secretChangedTextEditor(e, v) {
        this.setState({disableSubmit: false});
        let tmp = {};
        _.set(tmp, `${this.state.rootKey}`, v);
        this.state.focusSecret = tmp;
    }

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openEditModal: false })} />,
            <FlatButton label="Submit" disabled={this.state.disableSubmit} primary={true} onTouchTap={() => submitUpdate()} />
        ];

        let submitUpdate = () => {
            this.updateSecret(false);
            this.setState({ openEditModal: false });
        }

        var objectIsBasicRootKey = _.size(this.state.focusSecret) == 1 && this.state.focusSecret.hasOwnProperty(this.state.rootKey);
        var content;

        if (objectIsBasicRootKey && this.state.useRootKey) {
            var title = `Editing ${this.state.namespace}${this.state.focusKey} with specified root key`;
            content = (
                <TextField
                    onChange={this.secretChangedTextEditor}
                    name="editingText"
                    disabled={this.state.disableTextField}
                    autoFocus
                    multiLine={true}
                    defaultValue={this.state.focusSecret[this.state.rootKey]}
                    fullWidth={true}
                />
            );
        } else {
            var title = `Editing ${this.state.namespace}${this.state.focusKey}`;
            content = (
                <JsonEditor
                    rootName={this.state.namespace+this.state.focusKey}
                    value={this.state.focusSecret}
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
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({ openEditModal: false })}
                autoScrollBodyContent={true}
                >
                {content}
                <div className={styles.error}>{this.state.errorMessage}</div>
            </Dialog>
        );
    }

    renderDeleteConfirmationDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openDeleteModal: false, deletingKey: '' })} />,
            <FlatButton label="Delete" style={{ color: white }} hoverColor={red300} backgroundColor={red500} primary={true} onTouchTap={() => this.deleteKey(this.state.deletingKey)} />
        ];

        return (
            <Dialog
                title={`Delete Confirmation`}
                modal={false}
                actions={actions}
                open={this.state.openDeleteModal}
                onRequestClose={() => this.setState({ openDeleteModal: false, errorMessage: '' })}
                >

                <p>You are about to permanently delete {this.state.namespace}{this.state.deletingKey}.  Are you sure?</p>
                <em>To disable this prompt, visit the settings page.</em>
            </Dialog>
        )
    }

    renderNewKeyDialog() {
        const MISSING_KEY_ERROR = "Key cannot be empty.";
        const DUPLICATE_KEY_ERROR = `Key '${this.state.namespace}${this.state.focusKey}' already exists.`;

        let validateAndSubmit = (e, v) => {
            if (this.state.focusKey === '') {
                this.setState({
                    errorMessage: MISSING_KEY_ERROR
                });
                return;
            }

            if (_.filter(this.state.secrets, x => x.key === this.state.focusKey).length > 0) {
                this.setState({
                    errorMessage: DUPLICATE_KEY_ERROR
                });
                return;
            }
            //console.log(this.state.focusSecret);
            this.updateSecret(true);
            this.setState({ openNewKeyModal: false, errorMessage: '' });
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openNewKeyModal: false, errorMessage: '' })} />,
            <FlatButton label="Submit" disabled={this.state.disableSubmit} primary={true} onTouchTap={validateAndSubmit} />
        ];

        var rootKeyInfo;
        var content;

        if (this.state.useRootKey) {
            rootKeyInfo = "Current Root Key: " + this.state.rootKey;
            var content = (
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
                    rootName={this.state.namespace+this.state.focusKey}
                    mode={'tree'}
                    onChange={this.secretChangedJsonEditor}
                />
            );
        }

        return (
            <Dialog
                title={`Create new secret`}
                modal={false}
                actions={actions}
                open={this.state.openNewKeyModal}
                onRequestClose={() => this.setState({ openNewKeyModal: false, errorMessage: '' })}
                autoScrollBodyContent={true}
                >
                <TextField name="newKey" autoFocus fullWidth={true} hintText="Insert object key" onChange={(e, v) => this.setState({ focusKey: v })} />
                {content}
                <div className={styles.error}>{this.state.errorMessage}</div>
                <div>{rootKeyInfo}</div>
            </Dialog>
        );
    }

    listSecretBackends() {
        axios.get(`/listsecretbackends?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
            .then((resp) => {
                var secretBackends = [];
                _.forEach(Object.keys(resp.data.data), (key) => {
                    if (resp.data.data[key].type == "generic") {
                        secretBackends.push({ key: key });
                    }
                });
                this.setState({
                    secretBackends: secretBackends,
                    disableAddButton: false,
                    buttonColor: green500
                });
            })
            .catch((err) => {
                console.error(err.response.data);
                this.setState({
                    errorMessage: err.response.data,
                    disableAddButton: true,
                    buttonColor: 'lightgrey'
                });
            });
    }

    getSecrets(namespace) {
        axios.get(`/listsecrets?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}&namespace=${encodeURI(namespace)}`)
            .then((resp) => {
                var secrets = _.map(resp.data.data.keys, (key) => {
                    return {
                        key: key
                    }
                });

                this.setState({
                    namespace: namespace,
                    secrets: secrets,
                    disableAddButton: false,
                    buttonColor: green500
                });
            })
            .catch((err) => {
                console.error(err.response.data);
                this.setState({
                    errorMessage: err.response.data,
                    disableAddButton: true,
                    buttonColor: 'lightgrey'
                });
            });
    }

    clickSecret(key, isFullPath) {
        let isDir = key[key.length - 1] === '/';
        if (isDir) {
            if (isFullPath) {
                this.getSecrets(`${key}`);
            } else {
                this.getSecrets(`${this.state.namespace}${key}`);
            }
        } else {
            let fullKey = `${this.state.namespace}${key}`;
            axios.get(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
                .then((resp) => {
                    this.setState({
                        errorMessage: '',
                        disableSubmit: false,
                        disableTextField: false,
                        openEditModal: true,
                        focusKey: key,
                        focusSecret: resp.data,
                        listBackends: false
                    });
                })
                .catch((err) => {
                    console.error(err.stack);
                });
        }
    }

    showDelete(key) {
        if (key[key.length - 1] === '/') {
            return (<IconButton />);
        } else {
            return (
                <IconButton
                    tooltip="Delete"
                    onTouchTap={() => {
                        if (window.localStorage.getItem("showDeleteModal") === 'false') {
                            this.deleteKey(key);
                        } else {
                            this.setState({ deletingKey: key, openDeleteModal: true })
                        }
                    } }
                    >
                    <FontIcon className="fa fa-times-circle" color={red500} />
                </IconButton>);
        }
    }

    renderList() {
        if (this.state.listBackends) {
            return _.map(this.state.secretBackends, (secretBackend) => {
                return (
                    <ListItem
                        style={{ marginLeft: -17 }}
                        key={secretBackend.key}
                        onTouchTap={() => {
                            this.setState(
                                {
                                    namespace: '/' + secretBackend.key,
                                    listBackends: false,
                                    secrets: this.getSecrets('/' + secretBackend.key)
                                })
                        } }
                        primaryText={<div className={styles.key}>{secretBackend.key}</div>}
                        //secondaryText={<div className={styles.key}>{secret.value}</div>}
                        >
                    </ListItem>
                );
            });
        } else {
            return _.map(this.state.secrets, (secret) => {
                return (
                    <ListItem
                        style={{ marginLeft: -17 }}
                        key={secret.key}
                        onTouchTap={() => { this.clickSecret(secret.key) } }
                        primaryText={<div className={styles.key}>{secret.key}</div>}
                        //secondaryText={<div className={styles.key}>{secret.value}</div>}
                        rightIconButton={this.showDelete(secret.key)}>
                    </ListItem>
                );
            });
        }
    }

    renderNamespace() {
        let namespaceParts = this.state.namespace.split('/');
        return (
            _.map(namespaceParts, (dir, index) => {
                if (index === 0) {
                    return (
                        <div style={{ display: 'inline-block' }} key={index}>
                            <span className={styles.link}
                                onTouchTap={() => this.setState(
                                    {
                                        listBackends: true,
                                        namespace: '/',
                                        disableAddButton: true,
                                        buttonColor: 'lightgrey'
                                    })}
                                >ROOT</span>
                            {index !== namespaceParts.length - 1 && <span>/</span>}
                        </div>
                    );
                }
                var link = [].concat(namespaceParts).slice(0, index + 1).join('/') + '/';
                return (
                    <div style={{ display: 'inline-block' }} key={index}>
                        <span className={styles.link}
                            onTouchTap={() => this.clickSecret(link, true)}>{dir.toUpperCase()}</span>
                        {index !== namespaceParts.length - 1 && <span>/</span>}
                    </div>
                );
            })
        );
    }

    render() {
        return (
            <div>
                {this.state.openEditModal && this.renderEditDialog()}
                {this.state.openNewKeyModal && this.renderNewKeyDialog()}
                {this.state.openDeleteModal && this.renderDeleteConfirmationDialog()}
                <h1 id={styles.welcomeHeadline}>Secrets</h1>
                <p>Here you can view, update, and delete keys stored in your Vault.  Just remember, <span className={styles.error}>deleting keys cannot be undone!</span></p>
                <FlatButton
                    label="New Secret"
                    backgroundColor={this.state.buttonColor}
                    disabled={this.state.disableAddButton}
                    hoverColor={green400}
                    labelStyle={{ color: white }}
                    onTouchTap={() => this.setState({
                        disableSubmit: true,
                        openNewKeyModal: true,
                        focusKey: '',
                        focusSecret: '',
                        errorMessage: ''
                    })} />
                <div className={styles.namespace}>{this.renderNamespace()}</div>
                <List>
                    {this.renderList()}
                </List>
            </div>
        );
    }
}

export default Secrets;
