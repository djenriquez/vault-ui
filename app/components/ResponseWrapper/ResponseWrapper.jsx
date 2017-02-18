import React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import sharedStyles from '../shared/styles.css';
import JsonEditor from '../shared/JsonEditor.jsx';
import SecretWrapper from '../shared/Wrapping/Wrapper.jsx'

function snackBarMessage(message) {
    let ev = new CustomEvent("snackbar", { detail: { message: message } });
    document.dispatchEvent(ev);
}

export default class ResponseWrapper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            wrapEditorValue: {}
        };

    }

    render() {
        let secretChangedJsonEditor = (v, syntaxCheckOk) => {
            if (syntaxCheckOk && v) {
                this.setState({ wrapEditorValue: v });
            } else {
                this.setState({ wrapEditorValue: null });
            }
        }

        return (
            <div>
                {this.state.openWrapTokenDialog && this.showWrappedToken()}
                <Tabs>
                    <Tab label="Response Wrapping" >
                        <Paper className={sharedStyles.TabInfoSection} zDepth={0}>
                            Here you can store data inside vault and collect a temporary, single-use token to display the initial data
                        </Paper>
                        <Paper className={sharedStyles.TabContentSection} zDepth={0}>
                            <JsonEditor
                                rootName="WRAP DATA"
                                height={'300px'}
                                value={this.state.wrapEditorValue}
                                onChange={secretChangedJsonEditor}
                            />
                            <div style={{ textAlign: 'center' }}>
                                <SecretWrapper
                                    data={this.state.wrapEditorValue}
                                    onReceiveError={snackBarMessage}
                                />
                            </div>
                        </Paper>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}