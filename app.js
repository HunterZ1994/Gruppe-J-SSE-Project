const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');

var htmlPath = path.join(__dirname) + '/html';
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

function createPasswordHash(value) {
    let res = value;
    for (i = 0; i < 1000, i++;) {
        res = crypto.createHash('sha256').update(res).digest('hex'),
    }
    return res;
}

app.get('/', function(req, res) {
    res.sendFile(htmlPath + '/index.html');
});

app.get('/login', function(req, res) {
    res.sendFile(htmlPath + '/signIn.html');
});

app.post('/login', function(req, res) {
    console.log(req.body);
    throw Error('Method login not implemented');
});

app.get('/register', function(req, res) {
    res.sendFile(htmlPath + '/singUp.html');
});

app.post('/register', function(req, res) {
    console.log('Register: ' + req.body);
    throw Error('Method register not implemented');
});

var port = process.env.PORT || 8080;

var server = app.listen(port, function() {
    console.log("Server listening on port %s...", port);
});