'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var routeHandler = require('./src/routeHandler');
var compression = require('compression');

var PORT = process.env.PORT || 8000;
var DOC_ROOT = process.env.VAULT_UI_DOC_ROOT ? `/${process.env.VAULT_UI_DOC_ROOT}` : "";
console.log(DOC_ROOT);

var app = express();
app.set('view engine', 'html');
// app.engine('html', require('hbs').__express);
app.use(`/dist`, compression(), express.static('dist'));

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

app.get(`${DOC_ROOT}/vaultui`, function (req, res) {
  routeHandler.vaultuiHello(req, res);
});

app.get('/docroot', function (req, res) {
  routeHandler.vaultuiDocRoot(req, res);
});

app.all(`${DOC_ROOT}/v1/*`, function (req, res) {
  routeHandler.vaultapi(req, res);
})

app.get(`${DOC_ROOT}/`);

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.web.html'));
});
