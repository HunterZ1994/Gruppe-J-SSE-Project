// node modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const cookieParser = require('cookie-parser');
const { userInfo } = require('os');
const tools = require("./js/tools");
const { BADQUERY } = require('dns');
const { reset } = require('nodemon');
const htmlParser = require('node-html-parser');
const jimp = require('jimp');

// own modules
const db_conector = require("./js/database_connection");
const articleForm = require('./js/articleForm');
const errorHanlder = require('./js/errorHandler');
const search_results = require('./js/search_results');
const index = require('./js/index');
const cart = require('./js/cart');

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
        db_conector.addArticle({ ...fields, imagePath: imagePath + `/${files.imagePath.name}`}, userid)
            .then(rows => {
                // file upload and saving
                const oldpath = files.imagePath.path;
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
        errorHanlder.createErrorResponse(fakeUserInfo, 403, "Access Denied")
        .then(html => {
            res.status = 403;
            res.send(html);
        }); 
    }

    if (!articleId) {
        errorHanlder.createErrorResponse(fakeUserInfo, 400, "Bad Request, No Article Id")
        .then(html => {
            res.status = 400;
            res.send(html);
        }); 
    }

    db_conector.deleteArticle(articleId)
        .then(rows => {
            index.createIndex(fakeUserInfo).then(html => {
                const message = "Löschen erfolgreich"
                const root = htmlParser.parse(html);
                root.querySelector('#head').appendChild(`<script> window.alert(${message}) </script>`);
                res.send(root.toString());
            }).catch(err => {
                console.log(err);
            }); 
        })
        .catch(err => {
            errorHanlder.createErrorResponse(fakeUserInfo, 400, "Internal Server Error")
            .then(html => {
                res.status = 500;
                res.send(html);
            }); 
        });
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
            // TODO: Replace with real credentials
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
                    // this should already avoid saving image if there is no image
                    switch(key.toLowerCase()) {
                        case 'imagepath': 
                            const imageName = files.imagePath.name;
                            const storedImage = jimp.read(dbArticle.imagePath);
                            const uploadImage = jimp.read(fs.readFileSync(imageName));

                            // check if hash of image changed 
                            if (jimp.diff(storedImage, uploadImage) !== 0) {
                                const newPath = `./assets/images/${userId}/${dbArticle.articleName}/${files.imagePath.name}`;

                                // delete image from file System
                                try {
                                    fs.unlinkSync(dbArticle.imagePath);
                                } catch(err) {
                                    console.log(err);
                                }

                                // read image from client
                                const rawData = fs.readFileSync(files.imagePath.name);

                                // write image to file system
                                fs.writeFile(newpath, rawData, function (err) {
                                    if (err) {
                                        // TODO: Replace with error handling
                                        console.log(err);
                                    }
                                });

                                // set new image for article
                                dbArticle.imagePath = newPath;
                            }
                            break;

                        default: 
                            // update to new values, except articleId
                            if (key.toLowerCaae() !== 'articleid') {
                                dbArticle[key] = article[key];
                            }
                            break;
                    }
                }
                db_conector.updateArticle(dbArticle)
                    .then(rows => {
                        const message = "Bearbeiten erfolgreich"
                        index.createIndex(fakeUserInfo)
                            .then(html => {
                                const root = htmlParser.parse(html);
                                root.querySelector('#head').appendChild(`<script> window.alert(${message}) </script>`);
                                res.send(root.toString());
                    }).catch(err => {
                        console.log(err);
                    }); 
                }).catch(err => {
                    console.log(err)
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