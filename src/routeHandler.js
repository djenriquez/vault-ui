'use strict';

var secrets = require('./secrets');
var login = require('./login');


module.exports = (function () {
    return {
        login: login.login,
        listSecrets: secrets.listSecrets,
        getSecret: secrets.getSecret,
        writeSecret: secrets.writeSecret
    }
})();
