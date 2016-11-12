'use strict';

var secrets = require('./secrets');
var login = require('./login');
var policies = require('./policies');

module.exports = (function () {
    return {
        login: login.login,
        listSecrets: secrets.listSecrets,
        getSecret: secrets.getSecret,
        writeSecret: secrets.writeSecret,
        deleteSecret: secrets.deleteSecret,
        listPolicies: policies.listPolicies,
        getPolicy: policies.getPolicy,
        updatePolicy: policies.updatePolicy,
        deletePolicy: policies.deletePolicy,
        setGithubTeam: policies.setGithubTeam,
        getGithubTeam: policies.getGithubTeam
    };
})();
