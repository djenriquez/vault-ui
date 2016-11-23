import React from 'react';

import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';

import _ from 'lodash';

import styles from './responseWrapper.css';

export default class ResponseWrapper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            WrapType: '',
            WrapValue: '',
            WrappedToken: '',
            WrapTTL: ''
        };

        _.bindAll(this,
            'checkTTLValue');
    }

    checkTTLValue(e, v) {
        //Try to parse as an int, if failed, return error
        this.setState({
            WrapTTL: v
        });
    }

    renderWrapFunction() {
        switch (this.state.WrapType) {
            case "WRAPVALUE":
                return (
                    <div>
                        <h3>Wrap Value</h3>
                        <div className="row">
                            <TextField
                                id="text-field-wrap-TTL"
                                value={this.state.WrapTTL}
                                onChange={this.checkTTLValue}
                                floatingLabelText="TTL in seconds"
                                />
                            <TextField
                                id="text-field-wrap"
                                value={this.state.WrapValue}
                                onChange={(e, v) => { this.setState({ WrapValue: v }) } }
                                multiLine={true}
                                floatingLabelText="Value to wrap"
                                />
                        </div>
                    </div>
                )
            case "WRAPSECRET":
                return (
                    <div>
                        <h3>Wrap Secret</h3>
                    </div>
                )
            case "UNWRAP":
                return (
                    <div>
                        <h3>Wrapped Response Token</h3>
                        <TextField
                            id="text-field-unwrap"
                            value={this.state.WrapValue}
                            onChange={(e, v) => { this.setState({ WrappedToken: v }) } }
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
            this.setState({ WrapType: v });
        }

        return (
            <div>
                <div>
                    <h1 id={styles.pageHeader}>Response Wrapping</h1>
                    <SelectField
                        style={{ paddingLeft: 8 }}
                        value={this.state.WrapType}
                        onChange={handleSelectFieldChange.bind(this)}
                        floatingLabelText="Wrap Function">
                        <MenuItem value={"WRAPVALUE"} primaryText="Wrap Value" />
                        <MenuItem value={"WRAPSECRET"} primaryText="Wrap Secret" />
                        <MenuItem value={"UNWRAP"} primaryText="Unwrap" />
                    </SelectField>
                </div>
                {this.renderWrapFunction()}
            </div>
        )
    }
}