import React, { PropTypes } from 'react';
import { browserHistory } from 'react-router';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/src/css/reset.css';
import 'jsoneditor/src/css/jsoneditor.css';
import 'jsoneditor/src/css/menu.css';
import 'jsoneditor/src/css/searchbox.css';
import 'jsoneditor/src/css/contextmenu.css';

function isValid(value) {
    return value !== '' && value !== undefined && value !== null;
};

class JsonEditor extends React.Component {
    static propTypes = {
        rootName: PropTypes.string,
        value: PropTypes.any,
        mode: PropTypes.oneOf(['tree', 'code']),
        schema: PropTypes.object,
        onChange: PropTypes.func,
    };

    static defaultProps = {
        rootName: '',
        value: '',
        mode: 'tree',
        schema: null,
        onChange: () => {}
    };

    state = {
        hasValue: false,
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
            modes: ['tree', 'code'],
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

    render() {
        return (
              <div style={{height: '400px'}} ref={(c) => { this.editorEl = c; }} />
        );
    }
}

export default JsonEditor;
