import React, { PropTypes } from 'react'
import styles from './login.css';
import TextField from 'material-ui/TextField';
import { browserHistory } from 'react-router'

export default class Login extends React.Component {
    constructor(props) {
      super(props);
      this.validateAuthToken = this.validateAuthToken.bind(this);
      this.state = {
          show: false,
          authToken: ""
      };
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({ show: true}, 2000);
        });
    }

    validateAuthToken(e) {
        if (e.keyCode === 13) {
            window.localStorage.setItem("vaultAuthenticationToken",this.state.authToken);
            window.location.href = '/';
        }
    }

    render () {
        return (
            <div id={styles.root} className="row middle-xs center-xs">
                <div className={`col-xs-12 col-sm-6 col-md-4 ${this.state.show ? styles.show : styles.hide}`}>
                    <div className="col-xs-12" id={styles.title}><img height="40" src="https://www.vaultproject.io/assets/images/favicon-16466d1a.png"></img>AULT</div>
                    <TextField
                        fullWidth={true}
                        className="col-xs-12"
                        hintText="Enter authentication token"
                        onKeyDown={this.validateAuthToken}
                        onChange={(e,v)=>this.setState({authToken: v})}
                    />
                </div>
            </div>
        );
    }
}
