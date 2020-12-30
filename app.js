const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const index = require('./js/index');

const htmlPath = path.join(__dirname) + '/html';
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

function createPasswordHash(value) {
    let res = value;
    for (let i = 0; i < 1000, i++;) {
        res = crypto.createHash('sha256').update(res).digest('hex');
    }
    return res;
}

function createResponseHTML(contentHTML) {
    // read header and Navigation
    // append content 
    // append possible footer
    // return string or file
}

app.get('/', function(req, res) {
    // should decide on user login what to return
    index.createIndex({loggedIn: true, role: 'vendor'}).then(result => {
        res.send(result);
    })
});

app.get('/login', function(req, res) {
    res.sendFile(htmlPath + '/signIn.html');
});

app.post('/login', function(req, res) {
    console.log(req.body);
    const dbpwd = createPasswordHash(req.body.password);
    // load user from db
    // compare password 
    // create cookie
    // return response
    throw Error('Method login not implemented');
});

app.get('/logout', function(req, res) {
    // TODO: logout
    res.sendFile(htmlPath + '/index.html');
});

app.get('/register', function(req, res) {
    res.sendFile(htmlPath + '/singUp.html');
});

app.post('/register', function(req, res) {
    console.log('Register: ' + req.body);
    // check password restrictions 
    const dbpwd = createPasswordHash(req.body.password);
    // create user object and set dbpwd
    // save new user to db
    // create cookie
    // return response
    throw Error('Method register not implemented');
});

app.get('/search', function (req, res)  {
    let searchKeyWord = encodeURI(req.query.key)
    console.log(searchKeyWord)
    // getSearchedArticles(searchKeyWord)
    throw Error('Method search not implemented')
});

// #region admin

app.get('/adminPanel', function(req, res) {
    // TODO: check for role
    // TODO: return admin page
    throw Error('Method adminPanel not implemented')
});

// #endregion

// #region vendor

function createVendorIndexPage() {
    // read all articles of vendor from db
    // place in html 
    // add into index.html
    // return hmtl 
}

app.get('/article/add', function(req, res) {
    // return add article page
});

app.post('/article/add', function(req, res) {
    // load article object
    // check validity
    // save to db
    // fail -> return addArticle Page with filled form and error message
    // return index page with articles of user and success message
});

app.delete('/article/delete', function(req, res) {
    // read id from query
    // delete article
    // fail return index with articles and error message
    // success return index with articles and success message
});


app.get('/article/edit', function(req, res) {
    // return article form filed
});

app.post('/article/edit', function(req, res) {
    // get json from body
    // check validity 
    // update in db
    // fail --> return filled editArticle with error message
    // success --> return index with sucess
});

//#endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});