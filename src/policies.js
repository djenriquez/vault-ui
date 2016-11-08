'use strict';

var axios = require('axios');
var _ = require('lodash');

exports.listPolicies = function (req, resp) {
    let endpoint = `/v1/sys/policy`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.getPolicy = function (req, resp) {
    let policyName = decodeURI(req.query['policy']);
    let endpoint = `/v1/sys/policy/${policyName}`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

// {
//     "policy:" {
//         ...
//     }
// }
exports.updatePolicy = function (req, resp) {
    let policyName = decodeURI(req.query['policy']);
    let endpoint = `/v1/sys/policy/${policyName}`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    let body = {
        value: _.get(req, "body.Policy")
    };

    axios.put(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}