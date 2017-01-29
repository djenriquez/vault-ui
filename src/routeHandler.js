'use strict';

var respwrapping = require('./respwrapping');
var vaultapi = require('./vaultapi');

module.exports = (function () {
    return {
        wrapValue: respwrapping.wrapResponse,
        unwrapValue: respwrapping.unwrapResponse,
        vaultapi: vaultapi.callMethod
    };
})();
