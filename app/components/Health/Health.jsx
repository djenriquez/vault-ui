import React, { PropTypes } from 'react'
import styles from './health.css';
import Paper from 'material-ui/Paper';

class Health extends React.Component {
    constructor(props) {
      super(props);
      this.renderCluster = this.renderCluster.bind(this);
      this.state = {
          cluster: {
            cluster_id: "c9abceea-4f46-4dab-a688-5ce55f89e228",
            cluster_name: "vault-cluster-5515c810",
            version: "0.6.1-dev",
            server_time_utc: 1469555798,
            standby: false,
            sealed: false,
            initialized: true
          }
      }
    }

    renderCluster() {
        return (
            <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3 center-xs">
            <Paper zDepth={1}>
                <div className={styles.cluster}>
                    <div>{this.state.cluster.cluster_id}</div>
                    <div>{this.state.cluster.cluster_name}</div>
                    <div>{this.state.cluster.version}</div>
                </div>
            </Paper>
        </div>
        );
    }

    render () {
        return (
            <div>
                <h1 id={styles.welcomeHeadline}>Health</h1>
                <p>Here you can view the health of your Vault cluster.</p>
                <div className="row space-around-xs">{this.renderCluster()}{this.renderCluster()}{this.renderCluster()}{this.renderCluster()}</div>
            </div>
        )
    }
}

export default Health;
