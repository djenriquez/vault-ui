import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import copy from 'copy-to-clipboard';
import Edit from 'material-ui/svg-icons/editor/mode-edit';
import Copy from 'material-ui/svg-icons/action/assignment';
import Delete from 'material-ui/svg-icons/action/delete';
import styles from './secret.css';

class Secret extends React.Component {
    constructor(props) {
      super(props);
      this.copyText = this.copyText.bind(this);
    }

    copyText() {
        copy(this.props.secret.value);
        document.dispatchEvent(copyEvent);
    }

    render () {
        return (
            <div className={styles.root}>
                <div>
                    <div className={styles.key}>{this.props.secret.key}</div>
                    <div className={styles.actionButtons}>
                        <IconButton tooltip="Copy Value" onClick={this.copyText}><Copy/></IconButton>
                        <IconButton tooltip="Edit"><Edit/></IconButton>
                        <IconButton tooltip="Delete"><Delete/></IconButton>
                    </div>
                </div>
                <div>{this.props.secret.value}</div>
            </div>
        )
    }
}

export default Secret;
