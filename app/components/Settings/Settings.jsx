import React from 'react';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import { Tabs, Tab } from 'material-ui/Tabs';
import sharedStyles from '../shared/styles.css';
import Paper from 'material-ui/Paper';
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

    setDiffAnnotationsPreference(e, isChecked) {
        window.localStorage.setItem('enableDiffAnnotations', isChecked);
    }

    setCapCachePreference(e, isChecked) {
        window.localStorage.setItem('enableCapabilitiesCache', isChecked);
    }

    setRootKey(e, rootKey) {
        window.localStorage.setItem('secretsRootKey', rootKey)
        this.setState({ rootKey: rootKey });
    }

    render() {
        return (
            <div>
                <Tabs>
                    <Tab label="VAULT UI SETTINGS" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can customize your Vault UI settings.
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <div>
                                <h2>General</h2>
                                <Checkbox
                                    label="Warn Dialog Before Delete"
                                    onCheck={this.setDeleteDialogPreference}
                                    defaultChecked={window.localStorage.getItem('showDeleteModal') === 'true'} />
                                <Checkbox
                                    label="Enable capabilities cache"
                                    onCheck={this.setCapCachePreference}
                                    defaultChecked={window.localStorage.getItem('enableCapabilitiesCache') === 'true'} />
                                <Checkbox
                                    label="Display annotations for JSON diff"
                                    onCheck={this.setDiffAnnotationsPreference}
                                    defaultChecked={window.localStorage.getItem('enableDiffAnnotations') === 'true'} />
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
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}

export default Settings;
