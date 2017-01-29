'use strict';

var policies = require('./policies');
var respwrapping = require('./respwrapping');
var vaultapi = require('./vaultapi');

module.exports = (function () {
    return {
        listPolicies: policies.listPolicies,
        getPolicy: policies.getPolicy,
        updatePolicy: policies.updatePolicy,
        deletePolicy: policies.deletePolicy,
        setGithubTeamPolicy: policies.setGithubTeamPolicy,
        getGithubTeamPolicy: policies.getGithubTeamPolicy,
        wrapValue: respwrapping.wrapResponse,
        unwrapValue: respwrapping.unwrapResponse,
        vaultapi: vaultapi.callMethod
    };
})();
