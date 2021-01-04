// node modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const cookieParser = require('cookie-parser');
const { userInfo } = require('os');
const { BADQUERY, resolve4 } = require('dns');
const { reset } = require('nodemon');
const htmlParser = require('node-html-parser');
const jimp = require('jimp');

// own modules
const db_conector = require("./js/database_connection");
const vendor = require('./js/vendor');
const errorHanlder = require('./js/errorHandler');
const search_results = require('./js/search_results');
const index = require('./js/index');
const cart = require('./js/cart');
const articleView = require('./js/article');
const tools = require("./js/tools");

// basic app setup
const app = express();
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/images', express.static(__dirname + '/assets/images'));
app.use('/css', express.static(__dirname + '/css'));

// TODO: replace hard-coded user info with cookie
const fakeUserInfo = { loggedIn: false, role: 'customer' };
const htmlPath = path.join(__dirname) + '/html';

//#region userAuthentication

app.get('/', function (req, res) {
    // TODO: replace hard-coded userInfo with info from cookie
    index.createIndex(req.cookies.userInfo).then(result => {
        res.send(result);
    })
});

app.get('/login', function (req, res) {
    res.sendFile(htmlPath + '/signin.html');
});

app.get('/logout', function (req, res) {
    // TODO: logout
    let userInfo = req.cookies.userInfo;
    userInfo.loggedIn = false;
    res.cookie('userInfo', userInfo).redirect('/');
});

app.get('/register', function (req, res) {
    res.sendFile(htmlPath + '/signup.html');
});

//#endregion

//#region articles

app.get('/search', function (req, res) {
    let key = encodeURI(req.query.key)
    // TODO: replace hard-coded userInfo with info from cookie
    search_results.createSearchResults(req.cookies.userInfo, key).then(result => {
        res.send(result);
    })
});

app.get('/article', function(req, res) {
    const articleId = req.query.articleId;
    // TODO: Replace userInfo
    articleView.createArticleView(fakeUserInfo, articleId).then(html => res.send(html)).catch(err => {
        res.status = err.code;
        res.send(err.html);
    });
});

//#endregion

// #region admin

app.get('/adminPanel', function (req, res) {
    // TODO: check for role
    // TODO: return admin page
    throw Error('Method adminPanel not implemented')
});

// #endregion

// #region vendor

app.get('/article/add', function (req, res) {
    // TODO: Replace userInfo
    vendor.createArticleForm(fakeUserInfo)
    .then(html => res.send(html))
    .catch(err => {
        res.status = err.code;
        res.send(err.html);
    });
});

app.post('/article/add', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userid = 1;
    const isVerndor = 'vendor' == 'vendor'

    if (!isVerndor) {
        // TODO: Replace fakeUserInfo
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.status;
            res.send(err.html);
        }); 
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // TODO: Input sanitazation
        // TODO: Replace fakeUserInfo
        vendor.addArticle(fakeUserInfo, fields, files)
            .then(html => res.send(html))
            .catch(err =>{
                res.status = err.code;
                res.send(err.html);
            });
    });
});

app.delete('/article/delete', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';
    const articleId = req.params.articleId;
    
    if (!isVendor) {
        // TODO: replace userInfo
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(err =>{
            res.status = err.code;
            res.send(err.html);
        });
    }

    // TODO: replace userInfo
    vendor.deleteArticle(fakeUserInfo, article)
        .then(html => res.send(html))
        .catch(err =>{
            res.status = err.code;
            res.send(err.html);
        });
});

app.get('/article/edit', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';
    const articleId = req.query.articleId;

    if (!isVendor) {
        // TODO: Replace userInfo
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(err =>{
            res.status = err.code;
            res.send(err.html);
        }); 
    }

    // TODO: Replace userInfo
    vendor.createArticleForm(fakeUserInfo, articleId)
    .then(html => res.send(html))
    .catch(err =>{
        res.status = err.code;
        res.send(err.html);
    });
});

app.post('/article/edit', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';

    if (!isVendor) {
        // TODO: replace userInfo
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });  
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        vendor.updateArticle(fakeUserInfo, fields, files)
        .then(html => res.send(html))
        .catch(err =>{
            res.status = err.code;
            res.send(err.html);
        });
    });
});

// #endregion

//#region cart

app.get('/cart', (req, res) => {
    // TODO: replace hard-coded userInfo with info from cookie
    cart.createCart(req.cookies.userInfo).then(result => {
        res.send(result);
    })
});

app.delete('/cart', (req, res) => {
    console.log(req.query.id);
    res.send('Youve deleted an item from your cart')
});

//#endregion

// #region comments


// #endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});