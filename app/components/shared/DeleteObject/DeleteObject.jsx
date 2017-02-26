import React, { PropTypes, Component } from 'react'
import _ from 'lodash';
import { callVaultApi } from '../VaultUtils.jsx'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

export default class VaultObjectDeleter extends Component {
    static propTypes = {
        path: PropTypes.string,
        forceShowDialog: PropTypes.bool,
        onReceiveResponse: PropTypes.func,
        onReceiveError: PropTypes.func,
        onModalClose: PropTypes.func
    }

    static defaultProps = {
        path: '',
        forceShowDialog: false,
        onReceiveResponse: () => { },
        onReceiveError: () => { },
        onModalClose: () => { }
    }

    constructor(props) {
        super(props)
    }

    state = {
        path: '',
        openDeleteModal: false
    };

    componentWillReceiveProps(nextProps) {
        // Trigger automatically on props change
        if (nextProps.path && !_.isEqual(nextProps.path, this.props.path)) {
            this.setState({ path: nextProps.path })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!_.isEqual(prevState.path, this.state.path) && this.state.path) {
            if (window.localStorage.getItem("showDeleteModal") === 'false' && !this.props.forceShowDialog) {
                this.DeleteObject(this.state.path);
            } else {
                this.setState({ openDeleteModal: true })
            }
        }
    }

    DeleteObject(fullpath) {
        callVaultApi('delete', fullpath)
            .then((response) => {
                this.setState({ path: '', openDeleteModal: false });
                this.props.onReceiveResponse(response.data);
            })
            .catch((err) => {
                this.setState({ path: '', openDeleteModal: false });
                this.props.onReceiveError(err);
            })
    }

    render() {
        const actions = [
            <FlatButton label="Cancel" primary={true} onTouchTap={() => { this.setState({ openDeleteModal: false, path: '' }); this.props.onModalClose()}} />,
            <FlatButton label="Delete" secondary={true} onTouchTap={() => this.DeleteObject(this.state.path)} />
        ];

        const style_objpath = {
            color: 'red',
            fontFamily: 'monospace',
            fontSize: '16px',
            paddingLeft: '5px'
        }

        return (
            <Dialog
                title="Delete Confirmation"
                modal={true}
                open={this.state.openDeleteModal}
                actions={actions}
            >
                <p>You are about to permanently delete the object at path:</p>
                <p style={style_objpath}>{this.state.path}</p>
                <p>Are you sure?</p>
                {!this.props.forceShowDialog ? <em>To disable this prompt, visit the settings page.</em> : null}
            </Dialog >
        )
    }
}