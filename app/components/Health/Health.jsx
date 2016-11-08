import React, { PropTypes } from 'react'
import styles from './health.css';
import Paper from 'material-ui/Paper';
import { green500, red500, yellow500 } from 'material-ui/styles/colors.js'
import _ from 'lodash';

class Health extends React.Component {
    constructor(props) {
      super(props);
      this.renderCluster = this.renderCluster.bind(this);
      this.state = {
        cluster : [
            {
                id: "c9abceea-4f46-4dab-a688-5ce55f89e227",
                name: "vault-cluster-5515c810",
                version: "0.6.1-dev",
                level: 0,
                message: 'blah'
            }, {
                id: "c9abceea-4f46-4dab-a688-5ce55f89e228",
                name: "vault-cluster-5515c810",
                version: "0.6.1-dev",
                level: 1,
                message: 'boh'
            }, {
                id: "c9abceea-4f46-4dab-a688-5ce55f89e229",
                name: "vault-cluster-5515c810",
                version: "0.6.1-dev",
                level: 2,
                message: 'argh'
            }, {
                id: "c9abceea-4f46-4dab-a688-5ce55f89e230",
                name: "vault-cluster-5515c810",
                version: "0.6.1-dev",
                level: 0,
                message: 'la'
            }
        ]
      }
    }

    renderCluster() {
        let chooseColor = (level) => {
            switch (level) {
                case 1:
                    return yellow500;
                case 2:
                    return red500;
                default:
                    return green500;
            }
        }
        return _.map(this.state.cluster, box => {
            return (
                <div key={box.id} className="col-xs-12 col-sm-6 col-md-4 col-lg-3 center-xs">
                <Paper zDepth={1}>
                    <div className={styles.cluster}>
                        <div className={styles.status} style={{backgroundColor: chooseColor(box.level)}}></div>
                        <div>{box.id}</div>
                        <div>{box.name}</div>
                        <div>{box.version}</div>
                        <div>{box.message}</div>
                    </div>
                </Paper>
            </div>
            );
        })

    }

    render () {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Health</h1>
                <p>Here you can view the health of your Vault cluster.</p>
                <div className="row space-around-xs">{this.renderCluster()}</div>
            </div>
        )
    }
}

export default Health;
