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
            newKeyErrorMessage: '',
            openDeleteModal: false,
            editingKey: -1,
            deletingKey: '',
            secrets: [],
            currentSecret: ''
        };

        this.namespace = '/';

        this.getSecrets = this.getSecrets.bind(this);
        this.renderSecrets = this.renderSecrets.bind(this);
        this.clickSecret = this.clickSecret.bind(this);
        this.renderEditDialog = this.renderEditDialog.bind(this);
        this.renderNewKeyDialog = this.renderNewKeyDialog.bind(this);
        this.renderDeleteConfirmationDialog = this.renderDeleteConfirmationDialog.bind(this);
        this.copyText = this.copyText.bind(this);
        this.deleteKey = this.deleteKey.bind(this);
    }

    componentDidMount() {
        this.getSecrets();
    }

    copyText(value) {
        copy(value);
        document.dispatchEvent(copyEvent);
    }

    deleteKey(key) {
        document.dispatchEvent(new CustomEvent("deleteKey", {
            detail: {
                key: key
            }
        }));
        this.setState({
            deletingKey: '',
            openDeleteModal: false
        });
    }

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openEditModal: false })} />
        ];

        let checkKey = (e, v) => {
            if (e.keyCode === 13) {
                document.dispatchEvent(new CustomEvent("changedKey", {
                    detail: {
                        key: this.state.editingKey,
                        value: e.target.value
                    }
                }));

                let fullKey = `${this.namespace}${this.state.editingKey}`;
                axios.post(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "VaultUrl": window.localStorage.getItem("vaultUrl"), "SecretValue": e.target.value })
                    .then((resp) => {
                        if (resp.status === 200) {
    
                        } else {
                            // errored
                        }
                    })
                    .catch((err) => {
                        console.error(err.stack);
                    })

                this.setState({ openEditModal: false });
            }
        }

        return (
            <Dialog
                title={`Editing ${this.state.editingKey}`}
                modal={false}
                actions={actions}
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({ openEditModal: false })}
                >
                <TextField name="editingText" autoFocus defaultValue={this.state.currentSecret} fullWidth={true} onKeyUp={checkKey} />
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
                onRequestClose={() => this.setState({ openDeleteModal: false, newKeyErrorMessage: '' })}
                >

                <p>You are about to permanently delete {this.state.deletingKey}.  Are you sure?</p>
                <em>To disable this prompt, visit the settings page.</em>
            </Dialog>
        )
    }

    renderNewKeyDialog() {
        const MISSING_KEY_ERROR = "Key cannot be empty.";
        const DUPLICATE_KEY_ERROR = `Key ${this.state.newKey.key} already exists.`;

        let validateAndSubmit = () => {
            if (this.state.newKey.key === '') {
                this.setState({
                    newKeyErrorMessage: MISSING_KEY_ERROR
                });
                return;
            }

            if (_.filter(this.state.secrets, x => x.key === this.state.newKey.key).length > 0) {
                this.setState({
                    newKeyErrorMessage: DUPLICATE_KEY_ERROR
                });
                return;
            }

            document.dispatchEvent(new CustomEvent("addedKey", {
                detail: {
                    key: this.state.newKey.key,
                    value: this.state.newKey.value,
                }
            }));

            let fullKey = `${this.namespace}${this.state.newKey.key}`;
            axios.post(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "VaultUrl": window.localStorage.getItem("vaultUrl"), "SecretValue": this.state.newKey.value })
                .then((resp) => {
                    if (resp.status === 200) {
                        let secrets = this.state.secrets;
                        secrets.push({key: this.state.newKey.key, value: this.state.newKey.value});
                        this.setState({
                            secrets: secrets
                        });
                    } else {
                        // errored
                    }
                })
                .catch((err) => {
                    console.error(err.stack);
                })

            this.setState({ openNewKeyModal: false, newKeyErrorMessage: '' });
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => this.setState({ openNewKeyModal: false, newKeyErrorMessage: '' })} />,
            <FlatButton label="Submit" primary={true} onTouchTap={validateAndSubmit} />
        ];

        let checkKey = (e, v) => {
            if (e.keyCode === 13) {
                document.dispatchEvent(new CustomEvent("changedKey", {
                    detail: {
                        key: this.state.editingKey,
                        value: e.target.value
                    }
                }));
                this.setState({ openNewKeyModal: false });
            }
        }

        let setNewKey = (e, v) => {
            let currentKey = this.state.newKey;
            if (e.target.name === "newKey") {
                currentKey.key = v;
            } else if (e.target.name === "newValue") {
                currentKey.value = v;
            }
            this.setState({
                newKey: currentKey
            });
        }

        let returnShortcut = (e, v) => {
            if (e.keyCode === 13) {
                validateAndSubmit();
            }
        }

        return (
            <Dialog
                title={`New Key`}
                modal={false}
                actions={actions}
                open={this.state.openNewKeyModal}
                onRequestClose={() => this.setState({ openNewKeyModal: false, newKeyErrorMessage: '' })}
                >
                <TextField name="newKey" autoFocus fullWidth={true} hintText="Key" onKeyDown={returnShortcut} onChange={(e, v) => setNewKey(e, v)} />
                <TextField name="newValue" fullWidth={true} hintText="Value" onKeyDown={returnShortcut} onChange={(e, v) => setNewKey(e, v)} />
                <div className={styles.error}>{this.state.newKeyErrorMessage}</div>
            </Dialog>
        );
    }

    getSecrets() {
        var keys = [];
        axios.get(`/listsecrets?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}&namespace=${encodeURI(this.namespace)}`)
            .then((resp) => {
                keys = resp.data.data.keys;

                var secrets = _.map(keys, (key) => {
                    return {
                        key: key
                    }
                });

                this.setState({
                    secrets: secrets
                });
            })
            .catch((err) => {
                console.error(err.stack);
            });
    }

    clickSecret(key) {
        if (key[key.length - 1] === '/') {
            this.namespace = `${this.namespace}${key}`;
            this.getSecrets();
        } else {
            let fullKey = `${this.namespace}${key}`;
            axios.get(`/secret?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
                .then((resp) => {
                    let val = typeof resp.data.value == 'object' ? JSON.stringify(resp.data.value) : resp.data.value;
                    this.setState({
                        openEditModal: true,
                        editingKey: key,
                        currentSecret: val
                    });
                })
                .catch((err) => {
                    console.error(err.stack);
                });

        }
    }

    renderSecrets() {
        return _.map(this.state.secrets, (secret) => {
            return (
                <ListItem
                    style={{ marginLeft: -17 }}
                    key={secret.key}
                    onTouchTap={() => { this.clickSecret(secret.key) } }
                    primaryText={<div className={styles.key}>{secret.key}</div>}
                    //secondaryText={<div className={styles.key}>{secret.value}</div>}
                    rightIconButton={<IconButton
                        tooltip="Delete"
                        onTouchTap={() => {
                            if (window.localStorage.getItem("showDeleteModal") === 'false') {
                                this.deleteKey(secret.key);
                            } else {
                                this.setState({ deletingKey: secret.key, openDeleteModal: true })
                            }
                        } }
                        >
                        <FontIcon className="fa fa-times-circle" color={red500} />
                    </IconButton>}>
                </ListItem>
            );
        });
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
                    label="Add Key"
                    backgroundColor={green500}
                    hoverColor={green400}
                    labelStyle={{ color: white }}
                    onTouchTap={() => this.setState({ openNewKeyModal: true, newKey: { key: '', value: '' } })} />
                <List>
                    {this.renderSecrets()}
                </List>
            </div>
        );
    }
}

export default Secrets;
