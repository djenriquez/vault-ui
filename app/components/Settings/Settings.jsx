import React, { PropTypes } from 'react';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import styles from './settings.css';

class Settings extends React.Component {
    constructor(props) {
      super(props);
      this.setDeleteDialogPreference = this.setDeleteDialogPreference.bind(this);
    }

    setDeleteDialogPreference(e, isChecked) {
        if (isChecked) {
            window.localStorage.setItem('showDeleteModal','true');
        } else {
            window.localStorage.setItem('showDeleteModal', 'false')
        }
    }

    render () {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Settings</h1>
                <p>Customize your settings here.</p>
                <p>You are currently connected to the Vault cluster on
                    <span className={styles.code}>{window.localStorage.getItem('vaultUrl')}</span>.
                To switch this, you will need to logout.</p>
            <Checkbox
                label="Warn Dialog Before Delete"
                onCheck={this.setDeleteDialogPreference}
                defaultChecked={window.localStorage.getItem('showDeleteModal') === 'true'}/>
            </div>
        )
    }
}

export default Settings;
