const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const index = require('./js/index');
const cart = require('./js/cart');
const search_results = require('./js/search_results');
const db_conector = require("./js/database_connection");
const cookieParser = require('cookie-parser');
const { userInfo } = require('os');
const tools = require("./js/tools");
const { BADQUERY } = require('dns');
const { reset } = require('nodemon');
const articleForm = require('./js/articleForm');
const errorHanlder = require('./js/errorHandler');
const htmlParser = require('node-html-parser');

const htmlPath = path.join(__dirname) + '/html';
const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

// TODO: replace hard-coded user info with cookie
const fakeUserInfo = { loggedIn: false, role: 'customer' };


app.use(express.static('public'));
app.use('/images', express.static(__dirname + '/assets/images'));
app.use('/css', express.static(__dirname + '/css'));

app.get('/', function (req, res) {
    // TODO: replace hard-coded userInfo with info from cookie
    index.createIndex(req.cookies.userInfo).then(result => {
        res.send(result);
    })
});

app.get('/login', function (req, res) {
    res.sendFile(htmlPath + '/signIn.html');
});

app.post('/login', function (req, res) {
    const dbpwd = tools.createPasswordHash(req.body.password);
    db_conector.getUserByUName(req.body.email).then(result => {
        if(Object.keys(result).length>1){
            const users = result[0];
            if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase()) {
                this.userInfo = { loggedIn: true, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).redirect('/')
            }else{
                this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
            }
        }else{
            this.userInfo = { loggedIn: false, userID: "", role: "" }
            res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
        }
    });
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

app.post('/register', function (req, res) {
    var user = req.body;
    user.pwHash = tools.createPasswordHash(user.password);
    db_conector.checkIfEmailExists(user).then(result =>{
        if(Object.keys(result).length>1){
            this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signup_error.html');
        }else{
             db_conector.addUser(user).then(result =>{
                 if(result.warningStatus == 0){
                    this.userInfo = { loggedIn: true, userID: user.email, role: 'customer' }
                    res.cookie('userInfo', this.userInfo).redirect('/');
                }else{
                    res.sendStatus(BADQUERY);
                 }
            });
        }
    }).catch(err =>{
        console.log(err);
    })
   
});

app.get('/search', function (req, res) {
    let key = encodeURI(req.query.key)
    // TODO: replace hard-coded userInfo with info from cookie
    search_results.createSearchResults(req.cookies.userInfo, key).then(result => {
        res.send(result);
    })
});

// #region admin

app.get('/adminPanel', function (req, res) {
    // TODO: check for role
    // TODO: return admin page
    throw Error('Method adminPanel not implemented')
});

// #endregion

// #region vendor

app.get('/article/add', function (req, res) {
    articleForm.createArticleForm(fakeUserInfo).then(html => res.send(html));
});

app.post('/article/add', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userid = 1;
    const isVerndor = 'vendor' == 'vendor'

    if (!isVerndor) {
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(html => {
            res.status = 403;
            res.send(html);
        }); 
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        const article = fields;
        const articleIsValid = article.articleName && article.descpt && article.price;

        if (!articleIsValid) {
            errorHanlder.createErrorResponse(fakeUserInfo, 400, "Bad Request")
            .then(html => {
                res.status = 400;
                res.send(html);
            });  
        }

        const imagePath = `./assets/images/${userid}/${article.articleName}`;
        db_conector.addArticle({ ...fields, imagePath: imagePath + `/${files.image.name}`}, userid)
            .then(rows => {
                // file upload and saving
                const oldpath = files.image.path;
                const newpath = imagePath;
                const rawData = fs.readFileSync(oldpath);
                if (!fs.existsSync(imagePath)) {
                    fs.mkdirSync(imagePath);
                }
                fs.writeFile(newpath, rawData, function (err) {
                    const message = err ? 'Speichern des Bildes fehlgeschlagen' : 'Hinzufügen erfolgreich';
                    // TODO replace fakeUserInfo
                    index.createIndex(fakeUserInfo).then(html => {
                        const root = htmlParser.parse(html);
                        root.querySelector('#head').appendChild(`<script> window.alert(${message}) </script>`);
                        res.send(root.toString());
                    }).catch(err => console.log(err)); 
                });
            })
            .catch(err => { 
                errorHanlder.createErrorResponse(fakeUserInfo, 500, "Internal Server Error")
                .then(html => {
                    res.status = 500;
                    res.send(html);
                }); 
            });
    });
});

app.delete('/article/delete', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';
    const articleId = req.params.articleId;
    
    if (!isVendor) {
        // TODO: replace with html answer
        res.status(403).send({error: 'forbidden :('});
    }

    if (!articleId) {
        // TODO: replace with html answer
        res.status(400).send({error: 'no article ID :('});
    }

    db_conector.deleteArticle(articleId)
        // TODO: Reploace with html answer -> index + window.alert success
        .then(res => res.status(200).send('Delete Success'))
        // TODO: Replace with html answer -> index + window.alert error
        .catch(err => res.status(500).send({err, message: 'Something bad happend'}));
});

app.get('/article/edit', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';
    const articleId = req.query.articleId;

    if (!isVendor) {
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(html => {
            res.status = 403;
            res.send(html);
        });  
    }

    if (!articleId) {
        errorHanlder.createErrorResponse(fakeUserInfo, 400, "Bad Request")
            .then(html => {
                res.status = 400;
                res.send(html);
            });  
    }

    db_conector.getArtcileById(articleId)
        .then(rows => {
            const dbArticle = rows[0];
            articleForm.createArticleForm(fakeUserInfo, dbArticle)
                .then(html => {
                    res.send(html);
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            errorHanlder.createErrorResponse(fakeUserInfo, 500, "Internal Server Error")
            .then(html => {
                res.status = 500;
                res.send(html);
            });  
        });
});

app.post('/article/edit', function (req, res) {
    // TODO: Replace with real creadentials -> DB Checking, else ins. deser.
    const userId = 1;
    const isVendor = 'vendor' === 'vendor';

    if (!isVendor) {
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(html => {
            res.status = 403;
            res.send(html);
        });  
    }

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        const article = fields;
        const articleIsValid = article.articleId && article.articleName && article.descpt && article.price;

        if (!articleIsValid) {
            errorHanlder.createErrorResponse(fakeUserInfo, 400, "Bad Request")
            .then(html => {
                res.status = 400;
                res.send(html);
            });  
        }

        // reading article for comparsion
        db_conector.getArtcileById(article.articleId)
            .then(rows => {
                const dbArticle = rows[0];
                for (const key of Object.keys(article)) {
                    switch(key.toLowerCase()) {
                        case 'imagepath': 
                            break;

                        case "articleid":
                            break;

                        default: 
                            dbArticle[key] = article[key];
                            break;
                    }
                }
                db_conector.updateArticle(dbArticle).then(rows => {
                    const message = "Bearbeiten erfolgreich"
                    index.createIndex(fakeUserInfo).then(html => {
                        const root = htmlParser.parse(html);
                        root.querySelector('#head').appendChild(`<script> window.alert(${message}) </script>`);
                        res.send(root.toString());
                    }).catch(err => console.log(err)); 
                }).catch(err => console.log(err));
            })
            .catch(err => {
                errorHanlder.createErrorResponse(fakeUserInfo, 500, "Internal Server Error")
                .then(html => {
                    res.status = 500;
                    res.send(html);
                });  
            });
    });
});

//#region cart

app.get('/cart', (req, res) => {
    // TODO: replace hard-coded userInfo with info from cookie
    cart.createCart(req.cookies.userInfo).then(result => {
        res.send(result);
    })
})

app.delete('/cart', (req, res) => {
    console.log(req.query.id);
    res.send('Youve deleted an item from your cart')
})

//#endregion

// #region comments


// #endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});