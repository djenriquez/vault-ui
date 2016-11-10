'use strict';

var axios = require('axios');
var _ = require('lodash');

/* Returned body
 {
 "auth": null,
 "data": {
   "keys": ["foo", "foo/"]
 },
 "lease_duration": 2764800,
 "lease_id": "",
 "renewable": false
 }
*/
exports.listSecrets = function (req, res) {

    let namespace = decodeURI(req.query['namespace']);
    let endpoint = `/v1/secret${namespace}?list=true`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': decodeURI(req.query['token']) } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}
/* Returned body
 {
   "foo": "bar"
 }
 Query params 'secret' and 'vaultaddr' must go through encodeURI()
*/
exports.getSecret = function (req, res) {
    let endpoint = `/v1/secret/${decodeURI(req.query['secret'])}`;
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

exports.writeSecret = function (req, res) {

    let endpoint = `/v1/secret${decodeURI(req.query['secret'])}`;
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    let body = _.get(req, "body.Value")
    let vaultAddr = _.get(req, 'body.VaultUrl');

    try {
        secretValue = JSON.parse(secretValue)
    } catch(e) { }

    axios.post(`${_.get(req, "body.VaultUrl")}${endpoint}`, body, config)
        .then((resp) => {
            res.json(resp.data.auth);
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send(err.response);
        });
}

exports.deleteSecret = function (req, res) {
    let endpoint = `/v1/secret${decodeURI(req.query['secret'])}`;
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    
    axios.delete(`${vaultAddr}${endpoint}`, config)
    .then((resp) => {
        res.sendStatus(resp.status);
    })
    .catch((err) => {
        console.error(err.stack);
        res.status(err.response.status).send(err.response);
    })
}

