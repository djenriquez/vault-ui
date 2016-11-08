var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var axios = require('axios');
var _ = require('lodash');
var routeHandler = require('./src/routeHandler');

const PORT = 8000;

var app = express();
app.set('view engine','.html');
app.use('/assets', express.static('dist'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.listen(PORT, () => {
    console.log(`Vault UI listening on: ${PORT}`);
});


app.post('/login', (req,res) => {
    routeHandler.login(req, res);
});

app.get('/listsecrets', (req, res) => {
    routeHandler.listSecrets(req, res);
});

app.get('/secret', (req, res) => {
    routeHandler.getSecret(req, res);
})

app.get('/')

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname,'/index.html'));
});