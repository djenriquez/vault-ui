'use strict';

var axios = require('axios');
var _ = require('lodash');

/* Returned body
   "auth": {
     "renewable": true,
     "lease_duration": 2764800,
     "metadata": {
       "username": "vishalnayak",
       "org": "hashicorp"
     },
     "policies": [
       "default",
       "dev-policy"
     ],
     "accessor": "f93c4b2d-18b6-2b50-7a32-0fecf88237b8",
     "client_token": "1977fceb-3bfa-6c71-4d1f-b64af98ac018"
   }
*/
exports.login = function (req, res) {
    let creds = _.get(req, "body.Creds");

    let endpoint = '';
    let body = {}
    let config = {}

    switch (creds.Type.toLowerCase()) {
        case 'github':
            endpoint = '/v1/auth/github/login';
            body = {
                token: creds.Token
            };
            break;
        case 'usernamepassword':
            endpoint = `/v1/auth/userpass/login/${creds.Username}`;
            body = {
                password: creds.Password
            };
            break;
        case 'token':
            endpoint = `/v1/auth/token/lookup`
            body = {
                token: creds.Token
            };
            config = {
                headers: { "X-Vault-Token": creds.Token }
            };
            break;
        default:
            res.status(400).send("Invalid auth method");
    }
    axios.post(`${_.get(req, "body.VaultUrl")}${endpoint}`, body, config)
        .then((resp) => {
            if (creds.Type.toLowerCase() === 'token') {
                res.json({
                    client_token: resp.data.data.id,
                    lease_duration: resp.data.lease_duration
                });
            } else {
                res.json(resp.data.auth);
            }
        })
        .catch((err) => {
            console.error(err.stack);
            res.status(err.response.status).send("Authorization failed");
        });
};