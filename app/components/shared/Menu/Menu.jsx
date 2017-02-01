import React, { PropTypes } from 'react';
import styles from './menu.css';
import { browserHistory } from 'react-router';

class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.applyActiveLink = this.applyActiveLink.bind(this);
        this.state = {
            togglePoliciesSubMenu: false
        }
    }

    applyActiveLink(name) {
        if (name === this.props.pathname) {
            return styles.activeLink
        };
    }

    render() {
        return (
            <div id={styles.root}>
                <div>
                    <p className={`${styles.link} ${this.applyActiveLink('/secrets')}`} onClick={() => browserHistory.push('/secrets')}>Secrets</p>
                </div>
                <div>
                    <p className={`${styles.link}`} onClick={() => this.setState({ togglePoliciesSubMenu: !this.state.togglePoliciesSubMenu})}>Policies</p>
                </div>
                {this.state.togglePoliciesSubMenu &&
                    <div className={this.state.togglePoliciesSubMenu ? styles.hide : styles.show}>
                        <div>
                            <p className={`${styles.link} ${styles.sublink}  ${this.applyActiveLink('/policies/manage')}`} onClick={() => browserHistory.push('/policies/manage')}>Manage</p>
                        </div>
                        <div>
                            <p className={`${styles.link} ${styles.sublink}  ${this.applyActiveLink('/policies/github')}`} onClick={() => browserHistory.push('/policies/github')}>Github</p>
                        </div>
                        <div>
                            <p className={`${styles.link} ${styles.disabled}  ${this.applyActiveLink('/policies/ec2')}`} onClick={() => browserHistory.push('/policies/ec2')}>EC2</p>
                        </div>
                    </div>
                }
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/tokens')}`} onClick={() => browserHistory.push('/tokens')}>Tokens</p>
                </div>
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/settings')}`} onClick={() => browserHistory.push('/settings')}>Settings</p>
                </div>
                <div>
                    <p className={`${styles.link}  ${this.applyActiveLink('/responsewrapper')}`} onClick={() => browserHistory.push('/responsewrapper')}>Response Wrapper</p>
                </div>
            </div>
        );
    }
}
/*<div>
    <p className={`${styles.link}  ${this.applyActiveLink('/health')}`} onClick={() => browserHistory.push('/health')}>Health</p>
</div>*/

export default Menu;
