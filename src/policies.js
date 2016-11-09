'use strict';

var axios = require('axios');
var _ = require('lodash');
var hcltojson = require('hcl-to-json');

exports.listPolicies = function (req, res) {
    let endpoint = `/v1/sys/policy`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.getPolicy = function (req, res) {
    let policyName = decodeURI(req.query['policy']);
    let endpoint = `/v1/sys/policy/${policyName}`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.updatePolicy = function (req, res) {
    let policyName = decodeURI(req.query['policy']);
    let endpoint = `/v1/sys/policy/${policyName}`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    //API requires an escaped JSON
    let policy = _.get(req, "body.Policy");

    // Attempt to parse into JSON incase a stringified JSON was sent
    try {
        policy = JSON.parse(policy)
    } catch(e) { }

    //If the user passed in an HCL document, convert to stringified JSON as required by the API
    let rules = typeof policy == 'object' ? JSON.stringify(policy) : JSON.stringify(hcltojson(policy));

    let body = {
        rules: rules
    };

    axios.put(`${vaultAddr}${endpoint}`, body, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            //console.error(err);
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.deletePolicy = function (req, res) {
    let policyName = decodeURI(req.query['policy']);
    let endpoint = `/v1/sys/policy/${policyName}`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.delete(`${vaultAddr}${endpoint}`, config)
    .then((resp) => {
        res.sendStatus(resp.status);
    })
    .catch((err) => {
        console.error(err.stack);
    })
}