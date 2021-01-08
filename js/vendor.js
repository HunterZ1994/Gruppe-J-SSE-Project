const tools = require('./tools');
const db_conector = require('./database_connection');
const index = require('./index');
const errorHandler = require('./errorHandler');
const htmlParser = require('node-html-parser');
const jimp = require('jimp');
const fs = require('fs');

function createArticleForm(userInfo, article) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, 'articleForm.html')
            .then(res => {
                let root = htmlParser.parse(res);
                if (article) {
                    for (const key of Object.keys(article)) {
                        if (key.toLowerCase() !== 'seller') {
                            let value = article[key];
                            if (key.toLowerCase() === 'imagepath' ) {
                                root = htmlParser.parse(root.toString().replace('{ image }', article[key] ? `<img src="${article[key]}" alt="Artikelbild"/>` : ' '))
                            }
                            const id = `#${key.charAt(0).toLowerCase() + key.slice(1)}`
                            root.querySelector(id).setAttribute('value', value);
                        }
                    }
                    root.querySelector('#submit').set_content('Speichern');
                    root.querySelector('#form').setAttribute('action', 'edit');
                }
                resolve(root.toString().replace('{ image }', ' '));
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
                        errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
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
        const articleIsValid = !!(article.articleId && article.articleName && article.descpt && article.price);

        if (articleIsValid) {
             // reading article for comparsion
            db_conector.getArtcileById(article.articleId)
            .then(rows => {
                const dbArticle = rows[0];
                let finalImagePath = dbArticle.ImagePath;;
                if (files.imagePath.size > 0) {
                    const folderPath = `/images/${userInfo.userId}/${article.articleName.replace(' ', '')}`;
                    const imageName = files.imagePath.name;
                    const imagePath = `${folderPath}/${imageName}`;

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
                    
                    finalImagePath = imagePath;
                }

                db_conector.updateArticle({...article, imagePath: finalImagePath})
                .then(resolve(true)).catch(err => {
                    console.log(err);
                    reject(false);
                });
            
            }).catch(err => {
                console.log(err);
                reject(false);
            });
        } else {
            reject(false);
        }
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