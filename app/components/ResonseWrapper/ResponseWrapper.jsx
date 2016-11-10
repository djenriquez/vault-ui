import React from 'react';

import styles from './responseWrapper.css';

class ResponseWrapper extends React.Component {
    
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1 id={styles.pageHeader}>Response Wrapper</h1>
            </div>
        )
    }
}

module.exports = ResponseWrapper;