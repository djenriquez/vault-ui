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
            if (err.response.status === 403) {
                res.status(err.response.status).send("You are not authorized to access these resources.");
            } else {
                res.status(err.response.status).send(err.message);
            }
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

    let body = {
        rules: JSON.stringify(policy)
    };

    axios.put(`${vaultAddr}${endpoint}`, body, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            res.status(err.response.status).send(err.response.data);
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

exports.setGithubTeamPolicy = function (req, res) {
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    let teamName = decodeURI(req.query['team']);
    let endpoint = `/v1/auth/github/map/teams/${teamName}`;
    let policy = _.get(req, "body.Policy");

    let body = {
        value: policy
    };

    axios.post(`${vaultAddr}${endpoint}`, body, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.getGithubTeamPolicy = function (req, res) {
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    let teamName = decodeURI(req.query['team']);
    let endpoint = `/v1/auth/github/map/teams/${teamName}`;

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}
