import React, { PropTypes, Component } from 'react'
import _ from 'lodash';
import { callVaultApi } from '../VaultUtils.jsx'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import update from 'immutability-helper';
import VaultObjectDeleter from '../DeleteObject/DeleteObject.jsx'

export default class MountTuneDeleteDialog extends Component {
    static propTypes = {
        mountpointObject: PropTypes.object,
        onActionTuneSuccess: PropTypes.func,
        onActionDeleteSuccess: PropTypes.func,
        onActionError: PropTypes.func,
        onClose: PropTypes.func
    }

    static defaultProps = {
        mountpointObject: null,
        onActionTuneSuccess: () => { },
        onActionDeleteSuccess: () => { },
        onActionError: () => { },
        onClose: () => { }
    }

    constructor(props) {
        super(props)
    }

    state = {
        mountpointObject: {},
        unmountPath: '',
        openDialog: false
    };

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(nextProps.mountpointObject, this.props.mountpointObject)) {
            this.setState({ mountpointObject: nextProps.mountpointObject })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.mountpointObject && !_.isEqual(prevState.mountpointObject, this.state.mountpointObject)) {
            this.setState({ openDialog: true })
        }
    }

    tuneMountpoint() {
        let mountCfg = _.clone(this.state.mountpointObject.config);
        if (mountCfg.default_lease_ttl != this.props.mountpointObject.config.default_lease_ttl) {
            if (!mountCfg.default_lease_ttl)
                mountCfg.default_lease_ttl = "system"
        } else {
            mountCfg.default_lease_ttl = "";
        }

        if (mountCfg.max_lease_ttl != this.props.mountpointObject.config.max_lease_ttl) {
            if (!mountCfg.max_lease_ttl)
                mountCfg.max_lease_ttl = "system"
        } else {
            mountCfg.max_lease_ttl = "";
        }

        if (mountCfg) {
            callVaultApi('post', `${this.state.mountpointObject.path}tune`, null, mountCfg)
                .then(() => {
                    this.props.onActionTuneSuccess(this.state.mountpointObject.path, this.state.mountpointObject.uipath);
                    this.setState({ mountpointObject: null, openDialog: false }, () => this.props.onClose());
                })
                .catch((err) => {
                    this.props.onActionError(err);
                })
        } else {
            this.setState({ mountpointObject: null, openDialog: false }, () => this.props.onClose());
        }
    }

    render() {
        const actions = [
            <FlatButton
                onTouchTap={() => this.setState({ unmountPath: this.state.mountpointObject.path })}
                label="Delete Mountpoint"
                secondary={true}
            />,
            <FlatButton
                onTouchTap={() => this.setState({ mountpointObject: null, openDialog: false }, () => this.props.onClose())}
                label="Cancel"
            />,
            <FlatButton
                onTouchTap={() => this.tuneMountpoint()}
                label="Save Settings"
                primary={true}
            />
        ];

        return (
            <div>
                {this.state.openDialog &&
                    <div>
                        <Dialog
                            title={`Tuning mountpoint ${this.state.mountpointObject.path}`}
                            open={this.state.openDialog}
                            contentStyle={{width: "500px"}}
                            onRequestClose={() => {
                                this.setState({
                                    openDialog: false,
                                    mountpointObject: null
                                });
                                this.props.onClose();
                            }}
                            actions={actions}
                        >
                            <div>
                                <div>
                                    <TextField
                                        floatingLabelFixed={true}
                                        floatingLabelText="Default Lease TTL in seconds"
                                        fullWidth={true}
                                        hintText="<system default>"
                                        value={this.state.mountpointObject.config.default_lease_ttl != 0 ? this.state.mountpointObject.config.default_lease_ttl : ''}
                                        onChange={(e) => {
                                            this.setState({ mountpointObject: update(this.state.mountpointObject, { config: { default_lease_ttl: { $set: e.target.value } } }) });
                                        }}
                                    />
                                </div>
                                <div>
                                    <TextField
                                        floatingLabelFixed={true}
                                        floatingLabelText="Maximum Lease TTL in seconds"
                                        fullWidth={true}
                                        hintText="<system default>"
                                        value={this.state.mountpointObject.config.max_lease_ttl != 0 ? this.state.mountpointObject.config.max_lease_ttl : ''}
                                        onChange={(e) => {
                                            this.setState({ mountpointObject: update(this.state.mountpointObject, { config: { max_lease_ttl: { $set: e.target.value } } }) });
                                        }}
                                    />
                                </div>
                            </div>
                        </Dialog >
                        <VaultObjectDeleter
                            path={this.state.unmountPath}
                            forceShowDialog={true}
                            onReceiveResponse={() => {
                                this.props.onActionDeleteSuccess(this.state.mountpointObject.path, this.state.mountpointObject.uipath);
                                this.setState({ unmountPath: '', mountpointObject: null, openDialog: false }, () => this.props.onClose());
                            }}
                            onReceiveError={(err) => {
                                this.setState({ unmountPath: '' });
                                this.props.onActionError(err);
                            }}
                        />
                    </div>
                }
            </div>
        )
    }
}