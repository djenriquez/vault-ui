import React, { PropTypes } from 'react';
import styles from './menu.css';
import { browserHistory } from 'react-router';

class Menu extends React.Component {
    constructor(props) {
      super(props);
      this.applyActiveLink = this.applyActiveLink.bind(this);
    }

    applyActiveLink(name) {
        if (name === this.props.pathname) {
            return styles.activeLink
        };
    }

    render () {
        return (
            <div id={styles.root}>
                <div>
                    <p className={`${styles.link} ${this.applyActiveLink('/secrets')}`} onClick={() => browserHistory.push('/secrets')}>Secrets</p>
                </div>
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/health')}`} onClick={() => browserHistory.push('/health')}>Health</p>
                </div>
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/settings')}`} onClick={() => browserHistory.push('/settings')}>Settings</p>
                </div>
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/policies')}`} onClick={() => browserHistory.push('/policies')}>Policies</p>
                </div>
            </div>
        );
    }
}

export default Menu;
