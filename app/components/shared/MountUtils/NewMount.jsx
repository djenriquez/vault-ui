import React, { PropTypes, Component } from 'react'
import _ from 'lodash';
import { callVaultApi } from '../VaultUtils.jsx'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class NewMountDialog extends Component {
    static propTypes = {
        mountType: PropTypes.oneOf(["auth", "secret"]).isRequired,
        supportedBackendTypes: PropTypes.array.isRequired,
        openDialog: PropTypes.bool,
        onActionSuccess: PropTypes.func,
        onActionError: PropTypes.func,
        onClose: PropTypes.func,
    }

    static defaultProps = {
        mountType: "auth",
        supportedBackendTypes: [],
        openDialog: false,
        onActionSuccess: () => { },
        onActionError: () => { },
        onClose: () => { }
    }

    constructor(props) {
        super(props)
    }

    state = {
        openDialog: false,
        backendType: '',
        backendDescription: '',
        backendPath: ''

    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.openDialog && nextProps.openDialog != this.props.openDialog) {
            // Reset
            this.setState({
                openDialog: true,
                backendType: '',
                backendDescription: '',
                backendPath: ''
            })
        }
    }

    BackendMount() {
        let fullpath;
        if (this.props.mountType == 'auth')
            fullpath = `sys/auth/${this.state.backendPath}`;
        else
            fullpath = `sys/mounts/${this.state.backendPath}`;

        let data = { type: this.state.backendType, description: this.state.backendDescription }

        callVaultApi('post', fullpath, null, data)
            .then(() => {
                this.props.onActionSuccess(this.state.backendType, fullpath);
                this.setState({ openDialog: false }, () => this.props.onClose());
            })
            .catch((err) => {
                this.props.onActionError(err);
            })
    }

    render() {
        const actions = [
            <FlatButton
                onTouchTap={() => this.setState({ openDialog: false }, () => this.props.onClose())}
                label="Cancel"
            />,
            <FlatButton
                onTouchTap={() => this.BackendMount()}
                label="Mount Backend"
                primary={true}
            />
        ];

        let title = this.props.mountType == "auth" ? "Add new authentication backend" : "Add new secret backend";

        return (
            <div>
                {this.state.openDialog &&
                    <Dialog
                        title={title}
                        open={this.state.openDialog}
                        contentStyle={{width: "500px"}}
                        onRequestClose={() => {
                            this.setState({
                                openDialog: false
                            });
                            this.props.onClose();
                        }}
                        actions={actions}
                    >
                        <div>
                            <div>
                                <SelectField
                                    floatingLabelText="Backend Type"
                                    floatingLabelFixed={true}
                                    fullWidth={true}
                                    value={this.state.backendType}
                                    onChange={(e,i,v) => this.setState({backendType: v, backendPath: v})}
                                >
                                    {_.map(this.props.supportedBackendTypes, (b) => {
                                        return (<MenuItem value={b} primaryText={b} />)
                                    })}
                                </SelectField>
                            </div>
                            <div>
                                <TextField
                                    floatingLabelFixed={true}
                                    floatingLabelText="Mount path"
                                    fullWidth={true}
                                    value={this.state.backendPath}
                                    onChange={(e) => this.setState({ backendPath: e.target.value }) }
                                />
                            </div>
                        </div>
                    </Dialog >
                }
            </div>
        )
    }
}