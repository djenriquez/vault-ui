'use strict';

var axios = require('axios');

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
        data: req.body
    }
    //console.log(config);
    axios.request(config)
        .then(function (resp) {
            res.json(resp.data);
        })
        .catch(function (err) {
            //console.error(err.response.data);
            //console.error(err.stack);
            res.status(err.response.status).send(err.response.data);
        });
};