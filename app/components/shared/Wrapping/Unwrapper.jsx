import React, { PropTypes, Component } from 'react'
import { callVaultApi } from '../VaultUtils.jsx'
import JsonEditor from '../JsonEditor.jsx';
import styles from './wrapping.css';

export default class SecretUnwrapper extends Component {
    static propTypes = {
        location: PropTypes.object,
    };

    constructor(props) {
        super(props)

        this.state = {
            headerMsg: 'Displaying data wrapped with token',
            editorContent: null,
            error: false,
        };
    }

    componentDidMount() {
        callVaultApi('post', 'sys/wrapping/unwrap', null, null, null, this.props.location.query.token, this.props.location.query.vaultUrl)
            .then((resp) => {
                this.setState({
                    editorContent: resp.data.data
                })
            })
            .catch((err) => {
                this.setState({
                    headerMsg: `Server returned error ${err.response.status} while unwrapping token`,
                    error: true,
                })
            })
    }

    render() {
        return (
            <div id={styles.container}>
                <div className={this.state.error ? styles.redgradient : styles.bwgradient} id={styles.cell}>
                    <h4>{this.state.headerMsg}</h4>
                    <h2>{this.props.location.query.token}</h2>
                </div>
                <div id={styles.content}>
                    {this.state.editorContent && <JsonEditor rootName={this.props.location.query.token} modes={['view']} mode={'view'} height={"500px"} value={this.state.editorContent} />}
                </div>
            </div>
        )
    }
}