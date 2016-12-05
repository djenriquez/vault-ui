'use strict';

var axios = require('axios');
var _ = require('lodash');

exports.wrapResponse = function (req, res) {
    let endpoint = `/v1/sys/wrapping/wrap`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = {
        headers: {
            'X-Vault-Token': req.query['token'],
            'X-Vault-Wrap-TTL': `${_.get(req, "body.ttl")}s`
        }
    };
    let dataValue = _.get(req, "body.value");
    try {
        dataValue = JSON.parse(dataValue)
    } catch (e) { }

    let data = { 'value': dataValue };

    axios.post(`${vaultAddr}${endpoint}`, data, config)
        .then((resp) => {
            res.json(resp.data.wrap_info);
        })
        .catch((err) => {
            res.status(err.response.status).send(err.response);
        });
}

exports.unwrapResponse = function (req, res) {
    let endpoint = `/v1/sys/wrapping/unwrap`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = {
        headers: {
            'X-Vault-Token': decodeURI(req.query['token'])
        }
    };

    axios.post(`${vaultAddr}${endpoint}`, {}, config)
        .then((resp) => {
            res.json(resp.data.data);
        })
        .catch((err) => {
            let error = _.get(err, "response.data.errors[0]");
            res.status(err.response.status).send(error);
        });
}