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
                getCartButton(article.ArticleId),
                getCommentForm()
            ]).then(results => {
                html = html.replace('{ article }', results[0]);
                html = html.replace('{ comments }', results[1]);
                html = html.replace('{ button }', userInfo.role === 'customer' ? results[2] : ' ');
                html = html.replace('{ form }', userInfo.loggedIn ? results[3] : 'Du musst angemeldet sein, um zu Kommentieren'); 
                const root = htmlParser.parse(html);
                if (userInfo.loggedIn) {
                    root.querySelector('#articleId').setAttribute('value', article.ArticleId);
                }
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

function getCommentForm() {
    return new Promise((resolve, reject) => {
        resolve(`<form method="POST" action="comment/add"> 
                <input type="hidden" name="articleId" id="articleId"/>


                <label for="comText">Kommentar: </label>
                <input type="textArea" name="comText" id="commText" required/>
                <button type="submit">Speichern</button>

                <div class="row">
                    { csrf }
                </div>

        </form>`);
    });
}



function getArticleHtml(article) {
    return new Promise((resolve, reject) => {
        let res = '<div>\n';
        res += `<h4> ${article.ArticleName} </h4> <br/>\n`;
        res += `<img src="${article.ImagePath}" alt="Artikelbild" />\n`;
        res += `<p> ${article.Descpt} </p> <br/>\n`;
        res += `<p> ${article.Price}€ </p> <br/>\n`;
        resolve(res += '</div><br/>\n');
    });

}

function getCommentsHtml(comments) {
    return new Promise((resolve, reject) => {
        let res = '<hr/>\n<div>\n';
        for (const cm of comments) {
            res += `<p> ${cm.FirstName}: </p> <p style="border: 1px solid black;"> ${cm.ComText} </p>\n`
        }
        resolve( res += '</div><br/>\n');
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