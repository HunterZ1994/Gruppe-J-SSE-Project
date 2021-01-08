const tools = require('./tools');
const db_conector = require('./database_connection');
const htmlParser = require('node-html-parser');

function createArticleView(userInfo, articleId) {
    return new Promise((resolve, reject) => {
        Promise.all([
            db_conector.getArtcileById(articleId),
            db_conector.getCommentsOfArticle(articleId)
        ]).then(results => {  
            buildArticlePage(userInfo, results[0][0], results[1])
            .then(html => resolve(html))
            .catch(err => {
                console.log(err);
                reject(err);
            });
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

function buildArticlePage(userInfo, article, comments) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, '/article.html')
        .then(html => {
            Promise.all([
                getArticleHtml(article),
                getCommentsHtml(comments),
                getCartButton(article.ArticleId)
            ]).then(results => {
                html = html.replace('{ article }', results[0]);
                html = html.replace('{ comments }', results[1]);
                html = html.replace('{ button }', results[2]);
                const root = htmlParser.parse(html);
                root.querySelector('#articleId').setAttribute('value', article.ArticleId);
                html = root.toString();
                resolve(html);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        })
        .catch(err => {
            console.log(err);
            reject(err);
        });
    });
}


function getCartButton(articleId) {
    return new Promise((resolve, reject) => {
        resolve(`<a href="cart/add?articleId=${articleId}"><button>In den Einkaufswagen</button> </a>`);
    });
}

function getArticleHtml(article) {
    return new Promise((resolve, reject) => {
        let res = '<div>\n';
        res += `<h4> ${article.ArticleName} </h4> <br/>\n`;
        res += `<image src="${article.ImagePath}" alt="Artikelbild" />\n`;
        res += `<p> ${article.Descpt} </p> <br/>\n`;
        res += `<p> ${article.Price}€ </p> <br/>\n`;
        resolve(res += '</div><br/>\n');
    });

}

function getCommenTsAndUser(comments) {
    return new Promise((resolve, reject) => {
        const promises = [];
        for (const cm of comments) {
            promises.push(db_conector.getUserById(cm.User));
        }

        Promise.all(promises).then(results => {
            resolve(results);
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    })
}

function getCommentsHtml(comments) {
    return new Promise((resolve, reject) => {
        getCommenTsAndUser(comments).then(users => {
            let res = '<hr/>\n<div>\n';
            for (const cm of comments) {
                const user = users.find(u => u.UserId === comments.User)[0];
                res += `<p> ${user.FirstName}: </p> <p style="border: 1px solid black;"> ${cm.ComText} </p>\n`
            }
            resolve( res += '</div><br/>\n');
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

function addComment(comText, articleId, userInfo) {
    return new Promise((resolve, reject) => {
        db_conector.addArticleComment(comText, articleId, userInfo.userId)
        .then(rows => {
            createArticleView(userInfo, articleId)
            .then(html => {
                resolve(html);
            })
            .catch(err => {
                console.log(err);
                reject(err);
            });
        })
        .catch(err => {
            console.log(err);
            reject(err);
        });
    });
}


module.exports = {
    createArticleView,
    addComment
}