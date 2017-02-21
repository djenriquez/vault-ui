'use strict';

var vaultapi = require('./vaultapi');

module.exports = (function () {
    return {
        vaultapi: vaultapi.callMethod
    };
})();
