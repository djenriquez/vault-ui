'use strict';

const AXIOS_TIME_OUT = process.env.AXIOS_TIME_OUT || 10000;

let axios = require('axios');
let _ = require('lodash');

exports.callMethod = function (req, res) {
    let vaultAddr = req.query.vaultaddr;
    if (!vaultAddr) {
        res.status(400).send("missing vaultaddr parameter");
        return;
    }
    delete req.query.vaultaddr;
    delete req.headers.host;
    let config = {
        method: req.method,
        baseURL: decodeURI(vaultAddr),
        url: req.path,
        params: req.query,
        headers: req.headers,
        data: req.body,
        timeout: AXIOS_TIME_OUT
    }
    axios.request(config)
        .then(function (resp) {
            res.json(resp.data);
        })
        .catch(function (err) {
            if (_.has(err, 'response.data.errors') &&
                    _.has(err, 'response.status') &&
                    err.response.data.errs.length > 0) {
                res.status(err.response.status).send(err.response.data);
            }
            else {
                res.status(502).send(err.message);
            }
        });
};
