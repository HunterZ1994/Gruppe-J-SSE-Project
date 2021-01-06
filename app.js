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

// own modules
const db_connector = require("./js/database_connection");
const vendor = require('./js/vendor');
const errorHandler = require('./js/errorHandler');
const search_results = require('./js/search_results');
const index = require('./js/index');
const cart = require('./js/cart');
const articleView = require('./js/article');
const tools = require("./js/tools");
const interceptor = require('./js/interceptor');
const session = require('express-session');

// basic app setup
const app = express();
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/images', express.static(__dirname + '/assets/images'));
app.use('/css', express.static(__dirname + '/css'));
app.use(interceptor.decodeRequestCookie);

// Sesion parameters

const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    PORT = 8080,
    NODE_ENV = 'developmnet',

    SESS_NAME = 'ssid',
    SESS_SECRET = 'ssh!quiet,it\'asecret',
    SESS_LIFETIME = TWO_HOURS
} = process.env;

const IN_PROD = NODE_ENV === 'production';

// build coockie

app.use(session({
    name: SESS_NAME,
    resave : false,
    saveUninitialized: false,
    secret : SESS_SECRET,
    cookie: {
        maxAge: SESS_LIFETIME,
        sameSite: true,
        secure: IN_PROD,
    },
    'QkFCQUFCQUFCQUFBQkFBQkFBQUJBQkFBQUFCQkFCQUFCQUJBQkJCQQ==': '123'
}))

// TODO: replace hard-coded user info with cookie
const fakeUserInfo = { userID: '0000000000', role: 'guest', loggedIn: false };
const htmlPath = path.join(__dirname) + '/html';

//#region userAuthentication

app.get('/', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    index.createIndex(userInfo).then(result => {
        res.send(result);
    })
});

app.get('/login', function (req, res) {
    res.sendFile(htmlPath + '/signIn.html');
});

app.post('/login', function (req, res, next) {
    const dbpwd = tools.createPasswordHash(req.body.password);
    db_connector.getUserByUName(req.body.email).then(result => {
        let path = '';
        let userInfo = {};
        if (Object.keys(result).length > 1) {
            const users = result[0];
            if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase() && !users.Blocked) {
                userInfo = { loggedIn: true, userId: users.UserId, role: users.Userrole }
                path = '/';
                //TODO set error paths back to error.
            } else{
                this.userInfo = { loggedIn: false, userId: users.UserId, role: users.Userrole }
                userInfo = { loggedIn: false, userId: users.UserId, role: users.Userrole }
                path = '/signin_error.html';
            }
        } else {
            this.userInfo = { loggedIn: false, userId: "", role: "" }
            userInfo = { loggedIn: false, userId: "", role: "" };
            path = '/signin_error.html';
        }
        const encoded = tools.encodeCookie('userInfo', userInfo);
        req.session[encoded.name] = encoded.cookie;
        req.session.save();
        res.cookie(encoded.name, encoded.cookie);
        if (path === '/') {
            res.redirect(path);
        } else {
            res.sendFile(htmlPath + path);
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', function (req, res) {
    res.sendFile(htmlPath + '/signup.html');
});

app.post('/register', function (req, res) {
    const user = req.body;
    user.pwHash = tools.createPasswordHash(user.password);
    db_connector.checkIfEmailExists(user).then(result => {
        if (Object.keys(result).length > 1){
            this.userInfo = { loggedIn: false, userID: user.UserId, role: user.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signup_error.html');
        } else {
             db_connector.addUser(user).then(result => {
                 if (result.warningStatus === 0) {
                    this.userInfo = { loggedIn: true, userID: user.email, role: 'customer' }
                    res.cookie('userInfo', this.userInfo).redirect('/');
                } else {
                    res.sendStatus(BADQUERY);
                 }
            });
        }
    }).catch(err => {
        console.log(err);
    })
   
});

//#endregion

//#region articles

app.get('/search', function (req, res) {
    const key = encodeURI(req.query.key)
    search_results.createSearchResults(tools.checkSession(req.session), key).then(result => {
        res.send(result);
    })
});

app.get('/product', function(req, res) {
    const articleId = req.query.articleId;
    articleView.createArticleView(tools.checkSession(req.session), articleId).then(html => res.send(html)).catch(err => {
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
    vendor.createArticleForm(tools.checkSession(req.session))
    .then(html => res.send(html))
    .catch(err => {
        res.status = err.code;
        res.send(err.html);
    });
});

app.post('/article/add', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor'

    if (!isVendor) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.status;
            res.send(err.html);
        }); 
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        vendor.addArticle(userInfo, fields, files)
            .then(html => res.send(html))
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    });
});

app.get('/article/delete', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';
    const articleId = req.query.articleId;
    
    if (!isVendor) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });
    }

    vendor.deleteArticle(userInfo, articleId)
        .then(html => {
            res.send(html);
        })
        .catch(err => {
            res.status = err.code;
            res.send(err.html);
        });
});

app.get('/article/edit', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';
    const articleId = req.query.articleId;

    if (!isVendor) {
        // TODO: Replace userInfo
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        }); 
    }

    // TODO: Replace userInfo
    vendor.createEditForm(userInfo, articleId)
    .then(html => {
        res.send(html);
    })
    .catch(err => {
        res.status = err.code;
        res.send(err.html);
    });
});

app.post('/article/edit', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';

    if (!isVendor) {
        // TODO: replace userInfo
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });  
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        vendor.updateArticle(userInfo, fields, files)
        .then(html => res.send(html))
        .catch(err => {
            res.status = err.code;
            res.send(err.html);
        });
    });
});

// #endregion

//#region cart

app.get('/cart', (req, res) => {
    cart.createCart(tools.checkSession(req.session)).then(result => {
        res.send(result);
    }).catch(err => res.redirect('/'));
});

app.get('/cart/add', (req, res) => {
    const articleId = req.query.articleId;
    cart.addToCart(tools.checkSession(req.session), articleId).then(bool => res.redirect('/')).catch(err => res.redirect('/cart'));
});

app.get('/cart/delete', (req, res) => {
    const articleId = req.query.articleId;
    cart.deleteFromCart(tools.checkSession(req.session), articleId).then(rows => {
        res.redirect('/cart')
    }).catch(err => {
        res.redirect('/cart')
    });
});

//#endregion

//#region checkout

app.get('/checkout', (req, res) => {
    // read user id
    // clear cart 
    // send response
});

//#endregion

// #region comments

app.post('/comment/add', (req, res) => {
    const comment = req.body;
    articleView.addComment(comment.comText, comment.articleId, tools.checkSession(req.session))
    .then(html => {
        res.send(html);
    })
    .catch(err => {
        console.log(err);
    });
});


// #endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});