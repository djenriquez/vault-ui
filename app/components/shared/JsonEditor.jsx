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
    mode: PropTypes.oneOf(['tree', 'form', 'text']),
    onChange: PropTypes.func,
  };
  
  static defaultProps = {
    rootName: '',
    value: '',
    mode: 'tree',
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
          this.props.onChange(this._jsoneditor.get(), this.state.hasValue);
        }
    } catch (e) {
        this.props.onChange(null, false);
    }
  }
  
  componentDidMount() {
    const {
      onChange,
      value,
    } = this.props;
    
    var container = this.editorEl;//ReactDOM.findDOMNode(this);
    var options = {
      name: this.props.rootName,
      mode: this.props.mode,
      modes: ['tree', 'code'],
      onChange: this.handleInputChange,
    };
    this._jsoneditor = new JSONEditor(container, options, value);
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