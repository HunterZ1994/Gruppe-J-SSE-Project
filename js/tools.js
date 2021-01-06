const navigation = require('./navigation')
const fs = require('fs')
const crypto = require('crypto');
const bacon = require('bacon-cipher');
const db_connector = require('./database_connection');
const moment = require('moment');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function buildArticlesTable(articles, userInfo) {
    let artTable = ''

    if (articles.length > 0) {
        artTable += '<table class="item-table-component">\n'
        artTable += '   <tr>\n'
        artTable += '       <th>Name</th>\n'
        artTable += '       <th>Description</th>\n'
        artTable += '       <th>Price</th>\n'
        artTable += '       <th>Image</th>\n'
        artTable += '   </tr>\n'

        for(const article of articles) {
            artTable += '   <tr>\n'
            artTable += '       <td class="item-name"><a href="/product?articleId=' + article.ArticleId + '">' + article.ArticleName + '</a></td>\n'
            artTable += '       <td class="item-descr">' + article.Descpt + '</td>\n'
            artTable += '       <td class="item-price">' + article.Price + '$</td>\n'
            artTable += '       <td class="item-image"><img src="' + article.ImagePath
                + '" style="max-height: 150px; max-width: 150px;"></td>\n'

            if (!!userInfo && userInfo.role === 'vendor') {
                artTable += `<td> <a href='article/edit?articleId=${article.ArticleId}'> Bearbeiten </a> </td>\n`; 
                artTable += `<td> <a href='article/delete?articleId=${article.ArticleId}'> Löschen </a> </td>\n`; 
            }

            if (article && article.Cart ) {
                artTable +=  `<td> <a href="cart/delete?articleId=${article.ArticleId}&cartId=${article.Cart}"> Aus Warenkorb entfernen </a></td>"`;
            }

            artTable += '   </tr>\n'
        }
        
        if (!!userInfo && userInfo.role === 'vendor') {
            artTable += '<tr>\n';
            artTable += '<td> <a href="article/add"> Hinzufügen </a> </td>';
            artTable += '</tr>\n'

        }

        artTable += '</table>'
    }
    else {
        if (!!userInfo && userInfo.role === 'vendor') {
            artTable = 'Sie haben noch keine Artikel zum Verkauf angeboten.'
        } else {
            artTable = 'No products matching search criteria'
        }
    }

    return artTable
}

function readHtmlAndAddNav(userInfo, filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/../html/' + filename, 'utf8', function (err, html) {
            if (err) {
                throw err
            }
            resolve(html.replace('{ navigation }', navigation.createNavigationHTML(userInfo)))
        })
    })
}

function createPasswordHash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function decodeCookie(cookieValue) {
    const userBacon = JSON.parse(Buffer.from(cookieValue, 'base64').toString('ascii'));
        
    let userInfo = {};

    for (const key of Object.keys(userBacon)) {
        let orKey = bacon.decode(key, {alphabet}).toLowerCase();
        switch (orKey) {
            case 'userid': 
                orKey = 'userId'
                break;
            case 'loggedin': 
                orKey = 'loggedIn';
                break;
        }
        const orValue = typeof userBacon[key] === 'string' ? bacon.decode(userBacon[key], {alphabet}).toLowerCase() : userBacon[key];
        userInfo[orKey] = orValue;
    }

    return userInfo;

}

function encodeCookie(cookieName='cookie', cookie) {
    let encoded = {};

    for (const key of Object.keys(cookie)) {
        if (typeof cookie[key] === 'string') {
            encoded[bacon.encode(key, {alphabet})] = bacon.encode(cookie[key], {alphabet});
        } else {
            encoded[bacon.encode(key, {alphabet})] = cookie[key];
        }
    }

    return {name: Buffer.from(bacon.encode(cookieName, {alphabet})).toString('base64'), cookie: Buffer.from(JSON.stringify(encoded)).toString('base64')};
}

function checkSeesion(session) {
    const defaultInfo = { userID: '0000000000', role: 'guest', loggedIn: false };

    let userInfo;
    const userCookie = session[getEncodedName()];
    if (userCookie) {
        userInfo = decodeCookie(userCookie);
        userInfo.loggedIn = moment.invalid(session._expires) && moment().isBefore(session._expires);
    }

    return userInfo ? userInfo : defaultInfo;
}


function getEncodedName() {
    return Buffer.from(bacon.encode('userInfo', {alphabet})).toString('base64')
}

module.exports = {
    buildArticlesTable,
    readHtmlAndAddNav,
    createPasswordHash,
    checkSeesion,
    encodeCookie
}