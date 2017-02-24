'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var _ = require('lodash');
var routeHandler = require('./src/routeHandler');
var compression = require('compression');

var PORT = 8000;
var VAULT_URL_DEFAULT = process.env.VAULT_URL_DEFAULT || "";
var VAULT_AUTH_DEFAULT = process.env.VAULT_AUTH_DEFAULT || "GITHUB";
var VAULT_SUPPLIED_TOKEN_HEADER = process.env.VAULT_SUPPLIED_TOKEN_HEADER;

var app = express();
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use('/assets', compression(), express.static('dist'));

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

app.post('/wrap', function(req,res) {
    routeHandler.wrapValue(req, res);
});

app.post('/unwrap', function(req, res) {
    routeHandler.unwrapValue(req, res);
})

app.all('/v1/*', function(req, res, next) {
    routeHandler.vaultapi(req, res);
})

app.get('/');

app.get('*', function (req, res) {
    res.render(path.join(__dirname, '/index.html'),{
        defaultUrl: VAULT_URL_DEFAULT,
        defaultAuth: VAULT_AUTH_DEFAULT,
        suppliedAuthToken: VAULT_SUPPLIED_TOKEN_HEADER ? req.header(VAULT_SUPPLIED_TOKEN_HEADER) : ""
    });
});
