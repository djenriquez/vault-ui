import React, { PropTypes } from 'react'
import styles from './health.css';

class Health extends React.Component {
    render () {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Health</h1>
                <p>Here you can view the health of your Vault cluster.</p>
            </div>
        )
    }
}

export default Health;
