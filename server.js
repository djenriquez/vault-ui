'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var axios = require('axios');
var _ = require('lodash');
var routeHandler = require('./src/routeHandler');

var PORT = 8000;

var app = express();
app.set('view engine', '.html');
app.use('/assets', express.static('dist'));

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

app.post('/login', function (req, res) {
    routeHandler.login(req, res);
});

app.get('/listsecrets', function (req, res) {
    routeHandler.listSecrets(req, res);
});

app.get('/secret', function (req, res) {
    routeHandler.getSecret(req, res);
});

app.post('/secret', function (req, res) {
    routeHandler.writeSecret(req, res);
});

app.delete('/secret', function (req, res) {
    routeHandler.deleteSecret(req, res);
});

app.get('/listpolicies', function (req, res) {
    routeHandler.listPolicies(req, res);
});

app.get('/policy', function (req, res) {
    routeHandler.getPolicy(req, res);
});

app.put('/policy', function (req, res) {
    routeHandler.updatePolicy(req, res);
});

app.delete('/policy', function (req, res) {
    routeHandler.deletePolicy(req, res);
});

app.get('/githubteampolicy', function(req, res) {
    routeHandler.getGithubTeamPolicy(req, res);
});

app.post('/githubteampolicy', function(req, res) {
    routeHandler.setGithubTeamPolicy(req, res);
});

app.post('/wrap', function(req,res) {
    routeHandler.wrapValue(req, res);
});

app.post('/unwrap', function(req, res) {
    routeHandler.unwrapValue(req, res);
})

app.get('/');

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});