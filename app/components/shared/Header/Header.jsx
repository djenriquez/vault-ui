import React, { PropTypes } from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import { browserHistory } from 'react-router';
import styles from './header.css';

var logout = () => {
    window.localStorage.removeItem('vaultAuthenticationToken');
    browserHistory.push('/login');
}

class Header extends React.Component {
    render () {
        return (
            <AppBar
                style={{backgroundColor: '#000000'}}
                title={<span id={styles.title}>Vault</span>}
                onTitleTouchTap={() => browserHistory.push('/')}
                iconElementRight={<FlatButton onClick={logout} label="Logout" />}
              />
        )
    }
}

export default Header;
