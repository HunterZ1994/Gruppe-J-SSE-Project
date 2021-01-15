// node modules
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const { BADQUERY } = require('dns');
const { check, validationResult } = require('express-validator');

// own modules
const db_connector = require("./js/database_connection");
const vendor = require('./js/vendor');
const search_results = require('./js/search_results');
const index = require('./js/index');
const forgot_password = require('./js/forgot_password');
const cart = require('./js/cart');
const articleView = require('./js/article');
const tools = require("./js/tools");
const interceptor = require('./js/interceptor');
const session = require('express-session');
const admin = require('./js/admin_panel');
const signin = require("./js/signin");
const signup = require("./js/signup");
const security = require("./js/security");

const htmlPath = path.join(__dirname) + '/html';
// basic app setup
const app = express();
// disabling this so client is not seeing we use nodejs
app.disable('x-powered-by');
app.use(express.urlencoded({extended: true}));
app.use(express.json());
// app.use(rateLimit(security.rateLimitConfig));

// Setting helmet Options 
app.use(helmet.contentSecurityPolicy({
    directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": security.securityHeaders.contentSecurityPolicy.scrtiptSrc,
        "style-src": security.securityHeaders.contentSecurityPolicy.styleSrc
    }
}));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard({action: 'deny'}));
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());

// this needs to be after helmet config, so helmet also secures this
app.use(express.static('public', security.staticFileOptions));
app.use('/images', express.static(__dirname + '/assets/images', security.staticFileOptions));
app.use('/css', express.static(__dirname + '/assets/css', security.staticFileOptions));
app.use('/js', express.static(__dirname + '/assets/js', security.staticFileOptions));

// build session and cookie
app.use(session(security.sessionConfig))

// This has to be in this order!! 
// honestly don't mess with it, it will crash EVERYTHING!
app.use(cookieParser());
app.use(csrf(security.csrfConfig))

// setting the middleWare to decode the request cookie
// this cookie is only used for insecure deserialization leak
app.use(interceptor.decodeRequestCookie);

// toggles CSP header for security leak of XSS
app.use(interceptor.allowXSS);

// function to replace the { csrf } handle in every form
app.use(interceptor.appendCSRFToken);

if (!security.IN_PROD) {
    // just for debugging logging
    // app.use(interceptor.responseLogging);
}

//#region userAuthentication

app.get('/', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    index.createIndex(userInfo).then(result => {
        res.send(result);
    })
});

app.get('/login', function (req, res) {
    signin.getSignin(tools.checkSession(req.session)).then(result =>{
        res.send(result);
    })
});

app.post('/login', [check('email').escape().isEmail()], function (req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        signin.checkSignIn(req.body.email, req.body.password)
            .then(userInfo => {
                const encoded = tools.encodeCookie('userInfo', userInfo);
                req.session[encoded.name] = encoded.cookie;
                req.session.save();
                res.cookie(encoded.name, encoded.cookie, {
                    httpOnly: true,
                    sameSite: 'strict',
                });
                res.redirect('/');
            })
            .catch(err => {
                if (typeof err === 'string') {
                    res.send(err);
                } else {
                    if (err.redirect) {
                        res.redirect(err.redirect);
                    }
                    console.log(err);
                }
            });
    } else {
        res.redirect('/');
    }

});

app.get('/logout', function (req, res) {
    res.cookie(tools.getEncodedName(), '', {maxAge: 0});
    req.session[tools.getEncodedName()] = "";
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', function (req, res) {
    signup.getSignup(tools.checkSession(req.session)).then(result =>{
        res.send(result);
    })
});

app.post('/register', [check('firstName').escape().trim(),
    check('sureName').escape().trim(),
    check('street').escape().trim(),
    check('houseNr').escape().isNumeric().trim(),
    check('postalCode').escape().isNumeric().trim(),
    check('city').escape().trim(),
    check('email').escape().isEmail().trim(),
    check('security_question').escape().trim(),
    check('security_answer').escape().trim()], function (req, res) {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        const user = req.body;
        user.pwHash = tools.createPasswordHash(user.password);
        user.secAnswerHash = tools.createPasswordHash(user.security_answer)
        signup.checkSignUp(user, tools.checkSession(req.session)).then(result =>{
            res.send(result)
        });
    } else {
        res.redirect('/');
    }
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
    // YAY! Insecure Deserialization
    const userInfo = req.cookies.userInfo;

    if (userInfo && userInfo.role === 'admin') {
        admin.createAdminPanel(userInfo)
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
    // YAY! Insecure Deserialization
    const userInfo = req.cookies.userInfo;
    const isAdmin = userInfo.role === 'admin';
    const userId = req.query.userId;

    console.log(userInfo)
    
    if (!isAdmin) {
        res.redirect('/');
    } else {
        admin.deleteUser(userInfo, userId)
            .then(html => {
                res.redirect('/adminPanel');
            })
            .catch(err => {
                if (typeof err === 'string') {
                    res.send(err);
                } else {
                    if (err.redirect) {
                        res.redirect(err.redirect);
                    }
                    console.log(err);
                }
            });
    }
});

app.get('/adminPanel/block', function (req, res) {
    // YAY! Insecure deserialization!
    const userInfo = req.cookies.userInfo;
    const isAdmin = userInfo.role === 'admin';
    const userId = req.query.userId;
    // console.log(req.query);
    // console.log(userId);
    if (!isAdmin) {
        res.redirect('/');
    } else {
        admin.blockUser(userInfo, userId)
            .then(html => {
                res.redirect('/adminPanel');
            })
            .catch(err => {
                if (typeof err === 'string') {
                    res.send(err);
                } else {
                    if (err.redirect) {
                        res.redirect(err.redirect);
                    }
                    console.log(err);
                }
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
        res.redirect('/');
    }
});

app.get('/article/delete', function (req, res) {
    const userInfo = tools.checkSession(req.session);
    const isVendor = userInfo.role === 'vendor';
    const articleId = req.query.articleId;
    
    if (!isVendor) {
        res.redirect('/');
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
        res.redirect('/');
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
        res.redirect('/');
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

app.get('/logfiles', (req, res) => {
    res.send("You should not be able to see this!")
})


// #endregion

const port = process.env.PORT || 8080;

const options = {
    hostname: "hardware.bay",
    key: fs.readFileSync('./hardware.bay.key').toString(),
    cert: fs.readFileSync('./hardware.bay.crt').toString()
};

if (security.IN_PROD) {
    https.createServer(options, app).listen(port, function() {
        console.log("Server PRODUCTION listening on port %s...", port);
    });    
} else {
    http.createServer(app.listen(port, function() {
        console.log("Server DEVELOPMENT listening on port %s...", port);
    }));
}   

