'use strict';

var axios = require('axios');
var _ = require('lodash');
var qs = require('querystring');

/* Returned body
   "github/": {
       "config": { "default_lease_ttl": 0, "max_lease_ttl": 0 },
       "description": "",
       "type": "github"
   },
   "ldap/": {
       "config": { "default_lease_ttl": 0, "max_lease_ttl": 0 },
       "description": "",
       "type": "ldap"
   },
   "token/": {
       "config": { "default_lease_ttl": 0, "max_lease_ttl": 0 },
       "description": "token based credentials",
       "type": "token"
   },
   "userpass/": {
       "config": { "default_lease_ttl": 0, "max_lease_ttl": 0 },
       "description": "",
       "type": "userpass"
   }
*/
exports.listAuthBackends = function (req, res) {
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }
    let endpoint = "/v1/sys/auth";

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
    if( typeof(creds.Username) != "undefined" ) {
      var username = qs.escape(creds.Username);
    }

    let endpoint = '';
    let body = {};
    let config = { method: 'post' };
    var instance = axios.create({ baseURL: `${_.get(req, "body.VaultUrl")}/v1/auth/`});

    switch (creds.Type.toLowerCase()) {
        case 'github':
            config['url'] = 'github/login';
            config['data'] = { token: creds.Token };
            break;
        case 'usernamepassword':
            config['url'] = `userpass/login/${username}`;
            config['data'] = { password: creds.Password };
            break;
        case 'ldap':
            config['url'] = `ldap/login/${username}`;
            config['data'] = { password: creds.Password };
            break;
        case 'token':
            config['method'] = 'get';
            config['url'] = `token/lookup-self`;
            config['headers'] = { "X-Vault-Token": creds.Token };
            break;
        default:
            res.status(400).send("Invalid auth method");
    }
    instance.request(config)
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
