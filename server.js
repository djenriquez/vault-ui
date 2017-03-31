'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var axios = require('axios');
var _ = require('lodash');
var routeHandler = require('./src/routeHandler');
var compression = require('compression');

var PORT = 8000;
var VAULT_URL_DEFAULT = process.env.VAULT_URL_DEFAULT || "";
var VAULT_URL_DEFAULT_FORCE = process.env.VAULT_URL_DEFAULT_FORCE ? true : false;
var VAULT_AUTH_DEFAULT = process.env.VAULT_AUTH_DEFAULT || "GITHUB";
var VAULT_AUTH_DEFAULT_FORCE = process.env.VAULT_AUTH_DEFAULT_FORCE ? true : false;
var VAULT_AUTH_BACKEND_PATH = process.env.VAULT_AUTH_BACKEND_PATH
var VAULT_AUTH_BACKEND_PATH_FORCE = process.env.VAULT_AUTH_BACKEND_PATH_FORCE ? true : false;
var VAULT_SUPPLIED_TOKEN_HEADER = process.env.VAULT_SUPPLIED_TOKEN_HEADER

var app = express();
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use('/dist', compression(), express.static('dist'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.listen(PORT, function () {
    console.log('Vault UI listening on: ' + PORT);
});

app.get('/vaultui', function(req,res) {
    routeHandler.vaultuiHello(req, res);
});

app.all('/v1/*', function(req, res, next) {
    routeHandler.vaultapi(req, res);
})

app.get('/');

app.get('*', function (req, res) {
    res.render(path.join(__dirname, '/index.html'),{
        defaultUrl: VAULT_URL_DEFAULT,
        defaultAuth: VAULT_AUTH_DEFAULT,
        suppliedAuthToken: VAULT_SUPPLIED_TOKEN_HEADER ? req.header(VAULT_SUPPLIED_TOKEN_HEADER) : "",
        defaultBackendPath: VAULT_AUTH_BACKEND_PATH
    });
});
