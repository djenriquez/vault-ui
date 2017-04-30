'use strict';

var VAULT_URL_DEFAULT = process.env.VAULT_URL_DEFAULT || "";
var VAULT_URL_DEFAULT_FORCE = process.env.VAULT_URL_DEFAULT_FORCE ? true : false;
var VAULT_AUTH_DEFAULT = process.env.VAULT_AUTH_DEFAULT || "GITHUB";
var VAULT_AUTH_DEFAULT_FORCE = process.env.VAULT_AUTH_DEFAULT_FORCE ? true : false;
var VAULT_AUTH_BACKEND_PATH = process.env.VAULT_AUTH_BACKEND_PATH
var VAULT_AUTH_BACKEND_PATH_FORCE = process.env.VAULT_AUTH_BACKEND_PATH_FORCE ? true : false;
var VAULT_SUPPLIED_TOKEN_HEADER = process.env.VAULT_SUPPLIED_TOKEN_HEADER

exports.vaultuiHello = function (req, res) {
    let response = {
        defaultVaultUrl: VAULT_URL_DEFAULT,
        defaultVaultUrlForce: VAULT_URL_DEFAULT_FORCE,
        defaultAuthMethod: VAULT_AUTH_DEFAULT,
        defaultAuthMethodForce: VAULT_AUTH_DEFAULT_FORCE,
        suppliedAuthToken: VAULT_SUPPLIED_TOKEN_HEADER,
        defaultBackendPath: VAULT_AUTH_BACKEND_PATH,
        defaultBackendPathForce: VAULT_AUTH_BACKEND_PATH_FORCE
    }

    res.status(200).send(response);
};