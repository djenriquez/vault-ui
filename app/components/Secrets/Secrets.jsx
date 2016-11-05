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

const copyEvent = new CustomEvent("snackbar", {
  detail: {
    message: 'Copied!'
  }
});

class Secrets extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
          openModal: false,
          editingKey: -1
      }
      this.renderSecrets = this.renderSecrets.bind(this);
      this.renderEditDialog = this.renderEditDialog.bind(this);
      this.copyText = this.copyText.bind(this);
    }

    copyText(value) {
        copy(value);
        document.dispatchEvent(copyEvent);
    }

    renderEditDialog() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onClick={() => this.setState({ openModal: false })}/>
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
              this.setState({ openModal: false });
            }
        }

        return (
            <Dialog
                title={`Editing ${this.state.editingKey}`}
                modal={false}
                actions={actions}
                open={this.state.openModal}
                onRequestClose={() => this.setState({openModal: false})}
            >
            <TextField name="editingText" defaultValue={secretToChange} fullWidth={true} onKeyUp={checkKey}/>
            </Dialog>
        );
    }

    renderSecrets() {
        return _.map(this.props.secrets, (secret) => {
            return (
                <ListItem
                    key={secret.key}
                    onClick={() => this.setState({ openModal: true, editingKey: secret.key })}
                    primaryText={<div className={styles.key}>{secret.key}</div>}
                    secondaryText={<div className={styles.key}>{secret.value}</div>}
                    rightIconButton={<IconButton tooltip="Delete"><Delete/></IconButton>}>
                </ListItem>
            );
        });
    }

    render () {
        return (
            <div>
                {this.state.openModal && this.renderEditDialog()}
                <h1 id={styles.welcomeHeadline}>Secrets</h1>
                <p>Here you can view, update, and delete keys stored in your Vault.  Just remember, deleting keys cannot be undone!</p>
                <List>
                    {this.renderSecrets()}
                </List>
            </div>
        );
    }
}

export default Secrets;
