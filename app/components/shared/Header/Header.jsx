import React, { PropTypes } from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import { browserHistory } from 'react-router';
import styles from './header.css';

var logout = () => {
    window.localStorage.removeItem('vaultAuthenticationToken');
    browserHistory.push('/login');
}

class Header extends React.Component {
    render () {
        return (
            <div id={styles.headerWrapper}>
            <AppBar
                style={{backgroundColor: '#000000'}}
                title={<span id={styles.title}>Vault</span>}
                onTitleTouchTap={() => browserHistory.push('/')}
                iconElementLeft={<IconButton href={'https://github.com/Lucretius/vault_ui'}><FontIcon className="fa fa-github"></FontIcon></IconButton>}
                iconElementRight={<FlatButton onClick={logout} label="Logout" />}
              />
          </div>
        )
    }
}

export default Header;
