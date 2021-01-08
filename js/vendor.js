const tools = require('./tools');
const db_conector = require('./database_connection');
const index = require('./index');
const errorHandler = require('./errorHandler');
const htmlParser = require('node-html-parser');
const jimp = require('jimp');
const fs = require('fs');

function createArticleForm(userInfo, article) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, 'article/articleForm.html')
            .then(res => {
                const root = htmlParser.parse(res);
                if (article) {
                    for (const key of Object.keys(article)) {
                        if (key.toLowerCase() !== 'seller') {
                            const id = `#${key.charAt(0).toLowerCase() + key.slice(1)}`
                            root.querySelector(id).setAttribute('value', article[key]);
                        }
                    }
                    root.querySelector('#submit').set_content('Speichern');
                }
                resolve(root.toString());
            })
            .catch(err => {
                errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                    .then(html => reject(html));
            });
    });
}

function addArticle(userInfo, article, files) {
    return new Promise((resolve, reject) => {
        const articleIsValid = !!(article.articleName && article.descpt && article.price);
        if (articleIsValid) {
            const folderPath = `/images/${userInfo.userId}/${article.articleName.replace(' ', '')}`;
            const imageName = files.imagePath.name;
            const imagePath = `${folderPath}/${imageName}`;
            const dbArticle = {...article, imagePath};
            db_conector.addArticle(dbArticle, userInfo.userId)
                .then(rows => {
                    // file upload and saving
                    if (files.imagePath.size > 0) {
                        const clientFilePath = files.imagePath.path;
                        const rawData = fs.readFileSync(clientFilePath);
                        const absoluteDirectory = `${__dirname}/../assets${folderPath}`;
                        if (!fs.existsSync(absoluteDirectory)) {
                            try {
                                fs.mkdirSync(absoluteDirectory, {recursive: true});
                            } catch (err) {
                                console.log('Error while creating directory: ', {err});
                            }
                        }
                        const absoluteImage = `${absoluteDirectory}/${imageName}`;
                        fs.writeFile(absoluteImage, rawData, function (err) {
                            console.log(err);
                        });
                        resolve(true);
                    }
                })
                .catch(err => {
                    console.log({err});
                    reject(false);
                });
        } else {
            reject(false);
        }
    });
}

function createEditForm(userInfo, articleId) {
    return new Promise((resolve, reject) => {
        if (!articleId) {
            errorHanlder.createErrorResponse(userInfo, 400, "Bad Request")
                .then(html => {
                    reject(html)
                });
        }

        db_conector.getArtcileById(articleId)
            .then(rows => {
                const dbArticle = rows[0];
                createArticleForm(userInfo, dbArticle)
                    .then(html => {
                        resolve(html);
                    })
                    .catch(err => {
                        errorHanlder.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                            .then(html => {
                                console.log(html);
                                reject(html);
                            });
                    });
            })
            .catch(err => {
                errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                    .then(html => {
                        console.log(html);
                        reject(html);
                    });
            });
    });
}

function updateArticle(userInfo, article, files) {
    return new Promise((resolve, reject) => {
        const articleIsValid = article.articleId && article.articleName && article.descpt && article.price;

        if (!articleIsValid) {
            errorHanlder.createErrorResponse("No articleId", userInfo, 400, "Bad Request")
                .then(html => {
                    reject(html);
                });
        }

        // reading article for comparsion
        db_conector.getArtcileById(article.articleId)
            .then(rows => {
                const dbArticle = rows[0];
                for (const key of Object.keys(article)) {
                    // this should already avoid saving image if there is no image
                    switch (key.toLowerCase()) {
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
                                } catch (err) {
                                    console.log(err);
                                }

                                // read image from client
                                const rawData = fs.readFileSync(files.imagePath.name);

                                // write image to file system
                                fs.writeFile(newpath, rawData, function (err) {
                                    if (err) {
                                        errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                                            .then(html => reject(html));
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
                        index.createIndex(userInfo)
                            .then(html => {
                                const root = htmlParser.parse(html);
                                root.querySelector('#head').appendChild(`<script> window.alert(${message}) </script>`);
                                resolve(root.toString());
                            }).catch(err => {
                                errorHanlder.createErrorResponse(userInfo, 500, "Internal Server Error")
                                .then(html => {
                                    reject(html);
                                });
                        });
                    }).catch(err => {
                        console.log(err);
                        cerrorHanlder.createErrorResponse(userInfo, 500, "Internal Server Error")
                        .then(html => {
                            reject(html);
                        });  
                    }); 
                }).catch(err => {
                    console.log(err);
                    errorHanlder.createErrorResponse(userInfo, 500, "Internal Server Error")
                    .then(html => {
                        reject(html);
                    });  
            })
            .catch(err => {
                console.log(err);
                errorHanlder.createErrorResponse(userInfo, 500, "Internal Server Error")
                    .then(html => {
                        reject(html);
                    });
            });
    });
}

function deleteArticle(userInfo, articleId) {
    return new Promise((resolve, reject) => {
        if (!articleId) {
            errorHanlder.createErrorResponse(userInfo, 400, "Bad Request, No Article Id")
                .then(err => {
                    reject(err);
                });
        }

        db_conector.deleteArticle(articleId)
            .then(rows => {

                index.createIndex(userInfo).then(html => {
                    const message = "Löschen erfolgreich"
                    resolve(html.replace('{ script }', `<script>alert("${message}") </script>`));
                }).catch(err => {
                    console.log(err);
                    errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                        .then(html => {
                            reject(html);
                        });
                });
            })
            .catch(err => {
                errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                    .then(html => {
                        console.log(err);
                        reject(html);
                    });
            });
    });
}


module.exports = {
    createArticleForm,
    createEditForm,
    addArticle,
    updateArticle,
    deleteArticle
}