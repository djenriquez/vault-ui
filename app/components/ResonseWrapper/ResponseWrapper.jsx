import React from 'react';

import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';

import styles from './responseWrapper.css';

class ResponseWrapper extends React.Component {
    
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1 id={styles.pageHeader}>Response Wrapper</h1>
                <RadioButtonGroup name='secretSelect' defaultSelected='object'>
                    <RadioButton
                        value='object'
                        label='Wrap Value' />

                    <RadioButton
                        value='secret'
                        label='Wrap Secret' />

                    <RadioButton
                        value='unwrap_secret'
                        label='Unwrap Secret'/>
                    
                    <RadioButton
                        value='unwrap_object'
                        label='Unwrap Value'/>
                </RadioButtonGroup>


            </div>
        )
    }
}

module.exports = ResponseWrapper;