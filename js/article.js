const tools = require('./tools');
const db_conector = require('./database_connection');
const errorHandler = require('./errorHandler');
const htmlParser = require('node-html-parser');

function createArticleView(userInfo, articleId) {
    return new Promise((resolve, reject) => {
        Promise.all([
            db_conector.getArtcileById(articleId),
            db_conector.getCommentsOfArticle(articleId)
        ]).then(results => {   
            buildArticlePage(userInfo, results[1], results[2])
            .then(html => resolve(html))
            .catch(err => reject(err));
        }).catch(err => {
            console.log(err);
        });
    });
}

function buildArticlePage(userInfo, article, comments) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, '/article/article.html')
        .then(html => {
            const root = htmlParser.parse(html);
            root.querySelector('#articleId').setAttribute('value', article.articleId);
            html = root.toString();
            html = html.replace('{ article }', getArticleHtml(article))
            html = html.replace('{ comments }', getCommentsHtml(comments));
            htmt = html.replace('{ button }', `<button type="submit" method="post" action"cart/add/${article.articleId}">In den Einkaufswagen</button>`)
            resolve(html);
        })
        .catch(err => console.log(err));
    });
}


function getArticleHtml(article) {
    let res = '<div>\n';
    res += `<h4> ${article.articleName} </h4> <br/>\n`;
    res += `<image src="${article.imagePath}" alt="Artikelbild />\n`;
    res += `<p> ${article.descpt} </p> <br/>\n`;
    res += `<p> ${article.price} </p> <br/>\n`;
    return res += '</div><br/>\n';
}

function getCommentsHtml(comments) {
    let res = '<div>\n';

    for (const cm of comment) {
        res += `<p> ${cm} </p><br/>\n`
        res += '<hr/> \n';
    }
    
    return res += '</div><br/>\n';
}


module.exports = {
    createArticleView
}