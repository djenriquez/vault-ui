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
                <RadioButtonGroup defaultSelected='object'>
                    <RadioButton
                        value='object'
                        label='Wrap a Value' />

                    <RadioButton
                        value='secret'
                        label='Wrap a Secret' />
                </RadioButtonGroup>
            </div>
        )
    }
}

module.exports = ResponseWrapper;