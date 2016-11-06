import React, { PropTypes } from 'react';
import Secret from './components/Secret/Secret.jsx';
import IconButton from 'material-ui/IconButton';
import { List, ListItem } from 'material-ui/List';
import Edit from 'material-ui/svg-icons/editor/mode-edit';
import Copy from 'material-ui/svg-icons/action/assignment';
import Delete from 'material-ui/svg-icons/action/delete';
import styles from './secrets.css';
import _ from 'lodash';
import copy from 'copy-to-clipboard';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import { green500, green400, red500, yellow500, white } from 'material-ui/styles/colors.js'

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
          editingKey: -1
      }
      this.renderSecrets = this.renderSecrets.bind(this);
      this.renderEditDialog = this.renderEditDialog.bind(this);
      this.renderNewKeyDialog = this.renderNewKeyDialog.bind(this);
      this.copyText = this.copyText.bind(this);
      this.deleteKey = this.deleteKey.bind(this);
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
    }

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onClick={() => this.setState({ openEditModal: false })}/>
        ];
        let secretToChange = _.filter(this.props.secrets,x => x.key === this.state.editingKey)[0].value;

        let checkKey = (e,v) => {
            if (e.keyCode === 13) {
                document.dispatchEvent(new CustomEvent("changedKey", {
                  detail: {
                    key: this.state.editingKey,
                    value: e.target.value
                  }
              }));
              this.setState({ openEditModal: false });
            }
        }

        return (
            <Dialog
                title={`Editing ${this.state.editingKey}`}
                modal={false}
                actions={actions}
                open={this.state.openEditModal}
                onRequestClose={() => this.setState({openEditModal: false})}
            >
            <TextField name="editingText" defaultValue={secretToChange} fullWidth={true} onKeyUp={checkKey}/>
            </Dialog>
        );
    }

    renderNewKeyDialog() {
        const MISSING_KEY_ERROR = "Key cannot be empty.";
        const DUPLICATE_KEY_ERROR = `Key ${this.state.newKey.key} already exists.`;
        const MISSING_VALUE_ERROR = "Key must have a corresponding value.";

        let validateAndSubmit = () => {
            if (this.state.newKey.key === '') {
                this.setState({
                    newKeyErrorMessage: MISSING_KEY_ERROR
                });
                return;
            }

            if (this.state.newKey.value === '') {
                this.setState({
                    newKeyErrorMessage: MISSING_VALUE_ERROR
                });
                return;
            }

            if (_.filter(this.props.secrets, x => x.key === this.state.newKey.key).length > 0) {
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
            this.setState({ openNewKeyModal: false, newKeyErrorMessage: '' });
        }

        const actions = [
            <FlatButton label="Cancel" primary={true} onClick={() => this.setState({ openNewKeyModal: false, newKeyErrorMessage: '' })}/>,
            <FlatButton label="Submit" primary={true} onTouchTap={validateAndSubmit}/>
        ];

        let checkKey = (e,v) => {
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

        let setNewKey = (e,v) => {
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

        return (
            <Dialog
                title={`New Key`}
                modal={false}
                actions={actions}
                open={this.state.openNewKeyModal}
                onRequestClose={() => this.setState({openNewKeyModal: false, newKeyErrorMessage: ''})}
            >
            <TextField name="newKey" fullWidth={true} hintText="Key" onChange={(e,v) => setNewKey(e,v)}/>
            <TextField name="newValue" fullWidth={true} hintText="Value" onChange={(e,v) => setNewKey(e,v)}/>
            <div className={styles.error}>{this.state.newKeyErrorMessage}</div>
            </Dialog>
        );
    }

    renderSecrets() {
        return _.map(this.props.secrets, (secret) => {
            return (
                <ListItem
                    key={secret.key}
                    onClick={() => this.setState({ openEditModal: true, editingKey: secret.key })}
                    primaryText={<div className={styles.key}>{secret.key}</div>}
                    secondaryText={<div className={styles.key}>{secret.value}</div>}
                    rightIconButton={<IconButton
                        tooltip="Delete"
                        onTouchTap={() => this.deleteKey(secret.key)}>
                            <Delete/>
                        </IconButton>}>
                </ListItem>
            );
        });
    }

    render () {
        return (
            <div>
                {this.state.openEditModal && this.renderEditDialog()}
                {this.state.openNewKeyModal && this.renderNewKeyDialog()}
                <h1 id={styles.welcomeHeadline}>Secrets</h1>
                <p>Here you can view, update, and delete keys stored in your Vault.  Just remember, <span className={styles.error}>deleting keys cannot be undone!</span></p>
                <FlatButton
                    label="Add Key"
                    backgroundColor={green500}
                    hoverColor={green400}
                    labelStyle={{color: white}}
                    onTouchTap={() => this.setState({ openNewKeyModal: true, newKey: {key: '', value: ''} })}/>
                <List>
                    {this.renderSecrets()}
                </List>
            </div>
        );
    }
}

export default Secrets;
