import React, { PropTypes } from 'react';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import styles from './settings.css';
import _ from 'lodash';

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            rootKey: window.localStorage.getItem('secretsRootKey') || '',
            useRootKey: window.localStorage.getItem('useRootKey') === 'true' || false
        }
        _.bindAll(this,
            'setDeleteDialogPreference',
            'setRootKeyPreference',
            'setRootKey'
        );
    }

    setDeleteDialogPreference(e, isChecked) {
        window.localStorage.setItem('showDeleteModal', isChecked);
    }

    setRootKeyPreference(e, isChecked) {
        window.localStorage.setItem('useRootKey', isChecked);
        this.setState({
            useRootKey: isChecked
        });
    }

    setRootKey(e, rootKey) {
        window.localStorage.setItem('secretsRootKey', rootKey)
        this.setState({ rootKey: rootKey });
    }

    render() {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Settings</h1>
                <p>Customize your settings here.</p>
                <p>You are currently connected to the Vault cluster on
                    <span className={styles.code}>{window.localStorage.getItem('vaultUrl')}</span>.
                To switch this, you will need to logout.</p>
                <div>
                    <h2>General</h2>
                    <Checkbox
                        label="Warn Dialog Before Delete"
                        onCheck={this.setDeleteDialogPreference}
                        defaultChecked={window.localStorage.getItem('showDeleteModal') === 'true'} />
                </div>
                <div>
                    <h2>Secrets</h2>
                    <Checkbox
                        label="Use Root Key"
                        onCheck={this.setRootKeyPreference}
                        defaultChecked={window.localStorage.getItem('useRootKey') === 'true'} />
                    <TextField
                        fullWidth={true}
                        className="col-xs-12"
                        defaultValue={this.state.rootKey}
                        hintText="Root Key"
                        onChange={this.setRootKey}
                        />
                </div>
            </div>
        )
    }
}

export default Settings;
