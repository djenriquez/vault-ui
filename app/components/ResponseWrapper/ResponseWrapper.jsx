import React from 'react';

import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import { green500, green400, red500, red300, yellow500, white } from 'material-ui/styles/colors.js';
import Dialog from 'material-ui/Dialog';

import _ from 'lodash';
import axios from 'axios';

import styles from './responseWrapper.css';
import copy from 'copy-to-clipboard';

export default class ResponseWrapper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            WrapType: '',
            WrapValue: '',
            WrappedToken: '',
            WrapTokenDialogValue: '',
            WrappedSecretKey: '',
            WrapTTL: '',
            submitBtnColor: 'lightgrey',
            submitBtnDisabled: true,
            openWrapTokenDialog: false,
            errorMessage: ''
        };

        _.bindAll(
            this,
            'checkTTLValue',
            'submitBtnClick',
            'checkValue',
            'checkWrappedToken',
            'checkSecretKey',
            'showWrappedToken'
        );
    }

    restoreStateDefaults() {
        this.setState({
            WrapValue: '',
            WrappedToken: '',
            WrappedSecretKey: '',
            WrapTTL: '',
            submitBtnColor: 'lightgrey',
            WrapTokenDialogValue: '',
            submitBtnDisabled: true,
            errorMessage: ''
        });
    }

    checkTTLValue(e, v) {
        //Try to parse as an int, if failed, return error
        if (!isNaN(v) && v.indexOf('.') === -1) {
            let buttonColor = (v && (this.state.WrapValue || this.state.WrappedSecretKey) && v > 0) ? green500 : 'lightgrey';
            this.setState({
                WrapTTL: v,
                submitBtnColor: buttonColor,
                submitBtnDisabled: !(v && (this.state.WrapValue || this.state.WrappedSecretKey))
            });
        }
    }

    checkValue(e, v) {
        let buttonColor = (v && !isNaN(this.state.WrapTTL) && this.state.WrapTTL > 0) ? green500 : 'lightgrey';
        this.setState({
            WrapValue: v,
            submitBtnColor: buttonColor,
            submitBtnDisabled: !(v && this.state.WrapValue)
        });
    }

    checkWrappedToken(e, v) {
        let buttonColor = v ? green500 : 'lightgrey';
        this.setState({
            WrappedToken: v,
            submitBtnColor: buttonColor,
            submitBtnDisabled: !v
        });
    }

    checkSecretKey(e, v) {
        let buttonColor = v ? green500 : 'lightgrey';
        this.setState({
            WrappedSecretKey: v,
            submitBtnColor: buttonColor,
            submitBtnDisabled: !v
        });
    }

    submitBtnClick() {
        switch (this.state.WrapType) {
            case "WRAPVALUE":
                axios.post(`/wrap?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { "value": this.state.WrapValue, "ttl": this.state.WrapTTL })
                    .then((resp) => {
                        this.state.WrapTokenDialogValue = _.get(resp, "data.token");
                        this.setState({
                            openWrapTokenDialog: true
                        });
                    })
                    .catch((err) => {
                        console.error(err.stack);
                    });
                break;
            case "WRAPSECRET":
                break;
            case "UNWRAP":
                axios.post(`/unwrap?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${this.state.WrappedToken}`)
                    .then((resp) => {
                        this.setState({
                            WrapTokenDialogValue: resp.data.value,
                            openWrapTokenDialog: true,
                            errorMessage: ''
                        })
                    })
                    .catch((err) => {
                        this.setState({
                            errorMessage: 'Token is invalid'
                        });
                    });
                break;
        }
    }

    showWrappedToken() {
        const actions = [
            <div>
                <FlatButton label="Close" primary={true} onTouchTap={() => this.setState({ openWrapTokenDialog: false })} />
                <FlatButton label="Copy" secondary={true} onTouchTap={() => { copy(this.state.WrapTokenDialogValue), this.setState({ openWrapTokenDialog: false }) } } />
            </div>
        ];
        return (
            <Dialog
                actions={actions}
                modal={true}
                open={this.state.openWrapTokenDialog}
                >
                <div style={{ textAlign: 'center' }}>
                    <p>{this.state.WrapTokenDialogValue}</p>
                </div>

            </Dialog>
        );
    }

    renderWrapFunction() {
        switch (this.state.WrapType) {
            case "WRAPVALUE":
                return (
                    <div>
                        <div>
                            <TextField
                                id="text-field-wrap-TTL"
                                value={this.state.WrapTTL}
                                onChange={this.checkTTLValue}
                                floatingLabelText="TTL in seconds"
                                />
                        </div>
                        <div>
                            <TextField
                                id="text-field-wrap"
                                value={this.state.WrapValue}
                                onChange={this.checkValue}
                                fullWidth={true}
                                multiLine={true}
                                floatingLabelText="Value to wrap"
                                />
                        </div>

                    </div>
                )
            case "WRAPSECRET":
                return (
                    <div>
                        <div>
                            <TextField
                                id="text-field-wrap-TTL"
                                value={this.state.WrapTTL}
                                onChange={this.checkTTLValue}
                                floatingLabelText="TTL in seconds"
                                />
                        </div>
                        <TextField
                            id="text-field-wrap"
                            value={this.state.WrappedSecretKey}
                            onChange={this.checkSecretKey}
                            fullWidth={true}
                            floatingLabelText="Secret Key to wrap"
                            />
                    </div>
                )
            case "UNWRAP":
                return (
                    <div>
                        <TextField
                            id="text-field-unwrap"
                            floatingLabelText="Token to unwrap"
                            value={this.state.WrappedToken}
                            onChange={this.checkWrappedToken}
                            fullWidth={true}
                            />
                    </div>
                )
            default:
                return (
                    <div></div>
                )
        }
    }

    render() {
        let handleSelectFieldChange = (e, i, v) => {
            this.restoreStateDefaults();
            this.setState({
                WrapType: v,
            });
        }

        return (
            <div>
                {this.state.openWrapTokenDialog && this.showWrappedToken()}
                <div>
                    <h1 id={styles.pageHeader}>Response Wrapping</h1>
                    <SelectField
                        style={{ paddingLeft: 8 }}
                        value={this.state.WrapType}
                        onChange={handleSelectFieldChange.bind(this)}
                        floatingLabelText="Wrap Function">
                        <MenuItem value={"WRAPVALUE"} primaryText="Wrap" />
                        <MenuItem style={{ display: "none" }} value={"WRAPSECRET"} primaryText="Wrap Secret" />
                        <MenuItem value={"UNWRAP"} primaryText="Unwrap" />
                    </SelectField>
                </div>
                {this.renderWrapFunction()}
                <div>
                    <FlatButton
                        label="Submit"
                        backgroundColor={this.state.submitBtnColor}
                        hoverColor={green400}
                        disabled={this.state.submitBtnDisabled}
                        labelStyle={{ color: white }}
                        onTouchTap={() => this.submitBtnClick()} />
                </div>
                <div className={styles.error}>{this.state.errorMessage}</div>
            </div>
        )
    }
}