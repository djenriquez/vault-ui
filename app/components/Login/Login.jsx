import React, { PropTypes } from 'react'
import styles from './login.css';
import TextField from 'material-ui/TextField';

export default class Login extends React.Component {
    render () {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                <div className="col-xs-12 col-sm-6 col-md-4">
                    <div className="col-xs-12" id={styles.title}>VAULT</div>
                    <TextField
                        fullWidth={true}
                        className="col-xs-12"
                        hintText="Enter authentication token"
                    />
                </div>
            </div>
        );
    }
}
