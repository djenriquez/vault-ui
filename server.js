'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var routeHandler = require('./src/routeHandler');
var compression = require('compression');

var PORT = process.env.PORT || 8000;

var app = express();
app.set('view engine', 'html');
// app.engine('html', require('hbs').__express);
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

app.all('/v1/*', function(req, res) {
    routeHandler.vaultapi(req, res);
})

app.get('/');

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.web.html'));
});
