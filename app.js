// node modules
const express = require('express');
const path = require('path');
const formidable = require('formidable');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const htmlParser = require('node-html-parser');
const { BADQUERY } = require('dns');
const { check, validationResult } = require('express-validator');

// own modules
const db_connector = require("./js/database_connection");
const vendor = require('./js/vendor');
const errorHandler = require('./js/errorHandler');
const search_results = require('./js/search_results');
const index = require('./js/index');
const forgot_password = require('./js/forgot_password');
const cart = require('./js/cart');
const articleView = require('./js/article');
const tools = require("./js/tools");
const interceptor = require('./js/interceptor');
const session = require('express-session');
const admin = require('./js/admin_panel')

// basic app setup
const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/images', express.static(__dirname + '/assets/images'));
app.use('/css', express.static(__dirname + '/assets/css'));
app.use('/js', express.static(__dirname + '/assets/js'));
app.use(interceptor.decodeRequestCookie);
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // only 100 requests per client per windowMS
    delayMs: 0 // disable delay -> user hasfull speed until limit
}));

// Setting helmet Options 
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
app.use(csrf({cookie: true}));

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
        secure: IN_PROD,
        sameSite: 'strict',
        httpOnly: true,
    },
    'QkFCQUFCQUFCQUFBQkFBQkFBQUJBQkFBQUFCQkFCQUFCQUJBQkJCQQ==': '123'
}))

const securityHeaders = {
    contentSecurityPolicy: {
        name: 'Content-Security-Policy',
        value: "script-src 'self' https://apis.google.com"
    }
};

app.use(function(req, res, next){
    // needs to be toggeld for security issue
    if (req.path.toLowerCase().includes('product')) {
        res.removeHeader(securityHeaders.contentSecurityPolicy.name);
    } else {
        res.setHeader(securityHeaders.contentSecurityPolicy.name, securityHeaders.contentSecurityPolicy.value);
    }
    next();
});

app.use(function(req, res, next) {
    const oldSend = res.send;

    res.send = function(data) {
        const m  = data.replace('{ csrf }', `<input type="hidden' name="_csrf" value=${req.csrfToken()}`);
        console.log(m);
        oldSend.apply(res, arguments);
    }   
});



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
                // TODO set error paths back to error.
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
    user.secAnswerHash = tools.createPasswordHash(user.security_answer)
    db_connector.checkIfEmailExists(user).then(result => {
        if (Object.keys(result).length > 1){
            const userInfo = { loggedIn: false, userID: user.UserId, role: user.Userrole }
                res.cookie('userInfo', userInfo).sendFile(htmlPath + '/signup_error.html');
        } else {
             db_connector.addUser(user).then(result => {
                 if (result.warningStatus === 0) {
                     db_connector.createCart(result.insertId)
                    const userInfo = { loggedIn: true, userID: user.email, role: 'customer' }
                    res.cookie('userInfo', userInfo).redirect('/');
                } else {
                    res.sendStatus(BADQUERY);
                 }
            });
        }
    }).catch(err => {
        console.log(err);
    })
   
});

app.get('/forgotPassword', function (req, res) {
    const session = tools.checkSession(req.session);
    if (!session.loggedIn) {
        forgot_password.createForgotPwInput(session).then(result => {
            res.send(result);
        })
    } else {
        res.redirect('/');
    }
});

app.post('/forgotPassword', [check('email').escape().isEmail()], function (req, res) {
    const user = tools.checkSession(req.session);
    const errors = validationResult(req);
    if (!session.loggedIn && errors.isEmpty()) {
        user.email = req.body.email;
        forgot_password.createForgotPassword(user).then(result => {
            res.send(result)
        })
    } else {
        if (!errors.isEmpty())
            console.log(errors)
        res.redirect('/');
    }
});

app.post('/changePassword', [check('email').escape().isEmail()], function (req, res) {
    const session = tools.checkSession(req.session);
    const errors = validationResult(req);
    if (!session.loggedIn && errors.isEmpty()) {
        const user = req.body
        user.security_answer = tools.createPasswordHash(user.security_answer)
        user.new_password = tools.createPasswordHash(user.new_password)
        forgot_password.changePassword(user).then(success => {
            if (success) {
                res.redirect('/login')
            } else {
                res.send('<h1>Falsche Antwort</h1>Gehen Sie im Browser zurück')
            }
        })
    } else {
        res.redirect('/');
    }
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
    const session = tools.checkSession(req.session);

    if (session.role === 'admin') {
        admin.createAdminPanel(session)
            .then(html => res.send(html))
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    } else {
        res.redirect('/')
    }

});

app.get('/adminPanel/delete', function (req, res) {
    const session = tools.checkSession(req.session);
    const isAdmin = userInfo.role === 'admin';
    const userId = req.query.userId;
    
    if (!isAdmin) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });
    } else {
        admin.deleteUser(session, userId)
            .then(html => {
                res.send(html);
            })
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    }
});

app.get('/adminPanel/block', function (req, res) {
    const session = tools.checkSession(req.session);
    const isAdmin = userInfo.role === 'admin';
    const userId = req.query.userId;
    
    if (!isAdmin) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });
    } else {
        admin.blockUser(session, userId)
            .then(html => {
                res.send(html);
            })
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    }
});

// #endregion

// #region vendor

app.get('/article/add', function (req, res) {
    const session = tools.checkSession(req.session);

    if (session.role === 'vendor') {
        vendor.createArticleForm(session)
            .then(html => res.send(html))
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    } else {
        res.redirect('/')
    }
});

app.post('/article/add', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor'
    if (isVendor) {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            vendor.addArticle(userInfo, fields, files)
                .then(html => res.redirect('/'))
                .catch(err => {
                    res.redirect('/article/add')
                });
        });
    } else {
        errorHandler.createErrorResponse(null, userInfo, 403, "Access Denied")
        .then(err => {
            res.redirect('/article/add')
        }); 
    }
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
    } else {
        vendor.deleteArticle(userInfo, articleId)
            .then(html => {
                res.send(html);
            })
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    }
});

app.get('/article/edit', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';
    const articleId = req.query.articleId;

    if (!isVendor) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        }); 
    } else {
        vendor.createEditForm(userInfo, articleId)
            .then(html => {
                res.send(html);
            })
            .catch(err => {
                res.status = err.code;
                res.send(err.html);
            });
    }
});

app.post('/article/edit', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';

    if (!isVendor) {
        errorHandler.createErrorResponse(userInfo, 403, "Access Denied")
        .then(err => {
            res.status = err.code;
            res.send(err.html);
        });  
    } else {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            vendor.updateArticle(userInfo, fields, files)
                .then(html => res.send(html))
                .catch(err => {
                    res.status = err.code;
                    res.send(err.html);
                });
        });
    }
});

// #endregion

//#region cart

app.get('/cart', (req, res) => {
    const session = tools.checkSession(req.session);
    if (session.role === 'customer') {
        cart.createCart(session).then(result => {
            res.send(result);
        }).catch(err => {
            console.log(err);
            res.redirect('/');
        });
    } else {
        res.redirect('/')
    }
});

app.get('/cart/add', (req, res) => {
    const session = tools.checkSession(req.session);
    if (session.role === 'customer') {
        const articleId = req.query.articleId;
        cart.addToCart(session, articleId)
            .then(() => res.redirect('/cart'))
            .catch(err => {
                console.log(err);
                res.redirect('/');
            });
    } else {
        res.redirect('/')
    }

});

app.get('/cart/delete', (req, res) => {
    const session = tools.checkSession(req.session);

    if (session.role === 'customer') {
        const articleId = req.query.articleId;
        cart.deleteFromCart(session, articleId).then(rows => {
            res.redirect('/cart')
        }).catch(err => {
            console.log(err);
            res.redirect('/cart');
        });
    } else {
        res.redirect('/')
    }
});

//#endregion

//#region checkout

app.get('/checkout/:json', (req, res) => {
    const userInfo = tools.checkSession(req.session);
    const cartJSON = JSON.parse(req.params.json);
    if (userInfo) {
        cart.checkOut(userInfo, cartJSON).then(html => res.send(html)).catch(err => res.redirect('/cart'));
    } else {
        res.redirect('/cart');
    }
});

//#endregion

// #region comments

app.post('/comment/add', (req, res) => {
    const session = tools.checkSession(req.session);
    const comment = req.body;
    if (session.loggedIn) {
        articleView.addComment(comment.comText, comment.articleId, session)
            .then(html => {
                res.redirect('/product?articleId=' + comment.articleId)
            })
            .catch(err => {
                console.log(err);
                res.redirect('/product?articleId=' + comment.articleId)
            });
    } else {
        res.redirect('/product?articleId=' + comment.articleId)
    }
});


// #endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});
