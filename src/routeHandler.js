'use strict';

var vaultapi = require('./vaultapi');
var vaultui = require('./vaultui');

module.exports = (function () {
    return {
        vaultapi: vaultapi.callMethod,
        vaultuiHello: vaultui.vaultuiHello
    };
})();
