import React, { PropTypes } from 'react';
import JSONEditor from 'jsoneditor';
import JsonDiffReact from 'jsondiffpatch-for-react';
import Checkbox from 'material-ui/Checkbox';
import Divider from 'material-ui/Divider';
import 'jsoneditor/src/css/reset.css';
import 'jsoneditor/src/css/jsoneditor.css';
import 'jsoneditor/src/css/menu.css';
import 'jsoneditor/src/css/searchbox.css';
import 'jsoneditor/src/css/contextmenu.css';

function isValid(value) {
    return value !== '' && value !== undefined && value !== null;
}

class JsonEditor extends React.Component {
    static propTypes = {
        rootName: PropTypes.string,
        value: PropTypes.any,
        mode: PropTypes.oneOf(['tree', 'code', 'view']),
        modes: React.PropTypes.array,
        schema: PropTypes.object,
        height: PropTypes.string,
        onChange: PropTypes.func,
    };

    static defaultProps = {
        rootName: '',
        value: '',
        mode: 'tree',
        modes: ['tree', 'code'],
        schema: null,
        onChange: () => {}
    };

    state = {
        hasValue: false,
        initialValue: this.props.value,
        showDiff: true
    };

    constructor(props) {
        super(props);
        if (typeof JSONEditor === undefined) {
            throw new Error('JSONEditor is undefined!');
        }
    }

    handleInputChange = () => {
        try {
            this.setState({hasValue: isValid(this._jsoneditor.get())});
            if (this.props.onChange) {
                let schemaCheck = true;
                if (this.props.schema) {
                    schemaCheck = this._jsoneditor.validateSchema(this._jsoneditor.get());
                }
                this.props.onChange(this._jsoneditor.get(), this.state.hasValue, schemaCheck);
            }
        } catch (e) {
            this.props.onChange(null, false, false);
        }
    }

    componentDidMount() {
        var container = this.editorEl;//ReactDOM.findDOMNode(this);
        var options = {
            name: this.props.rootName,
            mode: this.props.mode,
            modes: this.props.modes,
            schema: this.props.schema,
            onChange: this.handleInputChange,
        };

        this._jsoneditor = new JSONEditor(container, options, this.props.value);
        this.setState({hasValue: true});
        this._jsoneditor.focus();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.rootName !== this.props.rootName) {
            this._jsoneditor.setName(nextProps.rootName);
        }
    }

    componentWillUnmount() {
        this._jsoneditor.destroy();
    }

    renderDiff = () => {
        if (_.isEqual(this.state.initialValue, this.props.value)) {
            return <div>No difference detected.</div>;
        } else {
            return (
                <JsonDiffReact
                    left={this.state.initialValue}
                    right={this.props.value}
                    annotated={window.localStorage.getItem("enableDiffAnnotations") === "true"}
                />
            );
        }
    }

    render() {
        return (
            <div>
              <div style={this.props.height ? {height: this.props.height} : null} ref={(c) => { this.editorEl = c; }} />
                <Divider/>
                <Checkbox
                    label="Show Diff"
                    checked={this.state.showDiff}
                    onCheck={(e,isChecked) => this.setState({showDiff: isChecked})}
                />
                {this.state.showDiff && this.renderDiff()}
            </div>
        );
    }
}

export default JsonEditor;
