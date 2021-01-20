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
const logger = require('./js/logger');
const { composite } = require('jimp');

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
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get('/login', function (req, res) {
    signin.getSignin(tools.checkSession(req.session)).then(result =>{
        res.send(result);
    }).catch(err => {
        console.log(err);
        res.redirect('/');
    });
});

app.post('/login', [check('email').escape().isEmail()], function (req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        signin.checkSignIn(req.body.email, req.body.password)
            .then(userInfo => {
                logger.writeLog(`User [${userInfo.userId}] loged in`, 1);
                const encoded = tools.encodeCookie('userInfo', userInfo);
                req.session[encoded.name] = encoded.cookie;
                req.session.save();
                res.cookie(encoded.name, encoded.cookie, security.cookieConfig);
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
    res.cookie(tools.getEncodedName(), '', {maxAge: 0, ...security.cookieConfig});
    req.session[tools.getEncodedName()] = "";
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', function (req, res) {
    signup.getSignup(tools.checkSession(req.session)).then(result =>{
        res.send(result);
    }).catch(err => {
        console.log(err);
        res.redirect('/');
    });
});

app.post('/register', [check('firstName').escape().trim(),
    check('sureName').escape().trim(),
    check('street').escape().trim(),
    check('houseNr').escape().isNumeric().trim(),
    check('postalCode').escape().isNumeric().trim(),
    check('city').escape().trim(),
    check('email').escape().isEmail().trim(),
    // check('password').escape().matches("(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$").trim(),
    check('security_question').escape().trim(),
    check('security_answer').escape().trim()], function (req, res) {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        const user = req.body;
        user.pwHash = tools.createPasswordHash(user.password);
        user.secAnswerHash = tools.createPasswordHash(user.security_answer)
        signup.checkSignUp(user)
        .then(result =>{
            if (typeof result === 'string') {
                res.send(result)
            } else {
                logger.writeLog(`User [${result.userId}] registered`, 1);
                const encoded = tools.encodeCookie('userInfo', result);
                req.session[encoded.name] = encoded.cookie;
                req.session.save();
                res.cookie(encoded.name, encoded.cookie, security.cookieConfig);
                res.redirect('/');
            }
        }).catch(err =>{
            if (typeof err === 'object') {
                if (err.redirect) {
                    res.redirect(err.redirect);
                }
            } 
            res.redirect('/register');
        });
    } else {
        console.log(errors);
        res.redirect('/');
    }
});

app.get('/forgotPassword', function (req, res) {
    const session = tools.checkSession(req.session);
    if (!session.loggedIn) {
        forgot_password.createForgotPwInput(session).then(result => {
            res.send(result);
        }).catch(err => {
            console.log(err);
            res.redirect('/');
        });
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
        }).catch(err => {
            console.log(err);
            res.redirect('/');
        });
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
        }).catch(err => {
            console.log(err);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

//#endregion

//#region articles

app.get('/search', function (req, res) {
    const session = tools.checkSession(req.session)
    if (session.role === 'admin') {
        const key = req.query.key;
        // Logging for fun
        if (key.toUpperCase().includes('DROP')) {
            logger.writeLog(`Nice try, but no we wont let you DROP something in the Database :D`, 4, req);
        }
        if (key.toUpperCase().includes('DELETE')) {
            logger.writeLog(`Nice try, but no we wont let you DELETE something in the Database :D`, 4, req);
            key.replace(/DELETE/g, '')
        }
        search_results.createInsecureAdminSearchResults(session, key).then(result => {
            res.send(result);
        }).catch(err => res.send(err))
    } else {
        const key = encodeURI(req.query.key)
        search_results.createSearchResults(session, key).then(result => {
            res.send(result);
        }).catch(err => {
            console.log(err);
            res.redirect('/');
        });
    }// ' UNION SELECT * FROM --
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
    const session = tools.checkSession(req.session);

    if (userInfo && userInfo.role === 'admin') {
        if (session.userId !== userInfo.userId) {
            logger.writeLog(`Someone HACKED the Admin [${userInfo.userId}] => entered Admin Panel`, 4, req);
        } else {
            logger.writeLog(`Admin [${userInfo.userId}] => entered Admin Panel`, 1);
        } 
        admin.createAdminPanel(userInfo)
            .then(html => {
                res.send(html);
            })
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
    
    if (!isAdmin) {
        res.redirect('/');
    } else {
        if (session.userId !== userInfo.userId) {
            logger.writeLog(`Someone HACKED the Admin [${userInfo.userId}] => blocked USER [${userId}]}`, 4, req);
        } else {
            logger.writeLog(`Admin [${userInfo.userId}] => deleted USER [${userId}]}`, 2);
        } 
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
    const session = tools.checkSession(req.session);
    const isAdmin = userInfo.role === 'admin';
    const userId = req.query.userId;
    if (!isAdmin) {
        res.redirect('/');
    } else {
        if (session.userId !== userInfo.userId) {
            logger.writeLog(`Someone HACKED the Admin [${userInfo.userId}] => blocked USER [${userId}]}`, 4, req);
        } else {
            logger.writeLog(`Admin [${userInfo.userId}] => blocked USER [${userId}]}`, 2);
        }   
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
                res.redirect('/');
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
                .then(html => res.redirect('/'))
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
        logger.writeLog(`Costumer [${session.userId}] => added Article [${articleId}] to Cart}`, 1);
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
        logger.writeLog(`Costumer [${session.userId}] => removed Article [${articleId}] from Cart`, 2);
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
        if (comment.comText.includes('<script>')) {
            logger.writeLog(`Costumer [${session.userId}] => XSS on [${comment.articleId}]`, 4, req);
        } else {
            logger.writeLog(`Costumer [${session.userId}] => commented on [${comment.articleId}]`, 1);
        }
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

app.get('/log', (req, res) => {
    const userInfo = tools.checkSession(req.session);
    if (userInfo.role !== 'admin') {
        logger.writeLog('Ohhh noooo someone found this...', 4, req);
    }
    logger.createLogHtml(userInfo)
        .then(html => {
            res.send(html);
        })
        .catch(html => {
            res.send(html);
        });
})


// #endregion

const port = process.env.PORT || 443;

const options = {
    hostname: "hardware.bay",
    key: fs.readFileSync('./hardware.bay.key').toString(),
    cert: fs.readFileSync('./hardware.bay.crt').toString()
};

https.createServer(options, app).listen(port, function() {
    console.log("Server PRODUCTION listening on port %s...", port);
});
