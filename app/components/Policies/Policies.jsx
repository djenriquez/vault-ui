import axios from 'axios';
import React, { PropTypes } from 'react'
import _ from 'lodash';

export default class Policy extends React.Component {
    constructor(props) {
        super(props);
        
    }

    updatePolicy() {
        if (e.keyCode === 13) {
            axios.put(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&secret=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`, { Policy: e.target.value })
            .then((resp) => {

            })
            .catch((err) => {
                console.error(err);
            });
        }
    }

    listPolicies() {
        axios.get(`/listpolicies?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
        .then((resp) => {

        })
        .catch((err) => {
            console.error(err);
        });
    }

    getPolicy() {
        axios.get(`/policy?vaultaddr=${encodeURI(window.localStorage.getItem("vaultUrl"))}&policy=${encodeURI(fullKey)}&token=${encodeURI(window.localStorage.getItem("vaultAccessToken"))}`)
        .then((resp) => {

        })
        .catch((err) => {
            console.error(err);
        });
    }

    render () {
        
    }
}
