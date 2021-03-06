const navigation = require('./navigation')
const fs = require('fs')
const crypto = require('crypto');
const bacon = require('bacon-cipher');
const moment = require('moment');
const security = require('./security');
const htmlParser = require('node-html-parser');

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
            artTable += '       <td class="item-image"><img src="' + article.ImagePath + '"></td>\n'

            if (!!userInfo && userInfo.role === 'vendor') {
                artTable += `<td> <a href='article/edit?articleId=${article.ArticleId}'> Bearbeiten </a> </td>\n`; 
                artTable += `<td> <a href='article/delete?articleId=${article.ArticleId}'> Löschen </a> </td>\n`; 
            }

            if (article && article.Cart ) {
                artTable +=  `<td> <a href="cart/delete?articleId=${article.ArticleId}&cartId=${article.Cart}"> Aus Warenkorb entfernen </a></td>`;
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

function buildUserTable(users) {
    let userTable = ''

    if (users.length > 0) {
        userTable += '<table class="item-table-component">\n'
        userTable += '   <tr>\n'
        userTable += '       <th>Name</th>\n'
        userTable += '       <th>FirstName      '
        userTable += '       <th>E-Mail</th>\n'
        userTable += '       <th>Gesperrt</th>\n'
        userTable += '   </tr>\n'
        
        for (const user of users) {
            userTable += '   <tr>\n'
            userTable += '        <td class="user-name">' + user.SureName + '</td>\n'
            userTable += '       <td class="user-firstname">' + user.FirstName + '</td>\n'
            userTable += '       <td class="user-email">' + user.Email + '</td>\n'
            userTable += `      <td class="user-email">  ${user.Blocked ? "Gesperrt" : " -- "} </td>\n`

            if (!(user.Userrole === 'admin' || user.Userrole === 'vendor')) {
                userTable += `<td class="user-name"> <a href='adminPanel/block?userId=${user.UId}'> Sperren </a> </td>\n`;
                userTable += `<td class="user-name"> <a href='adminPanel/delete?userId=${user.UId}'> Löschen </a> </td>\n`;
            }

            userTable += '   </tr>\n'
        }
        userTable += '</table>'
    }
	return userTable
}

function buildInsecureUserTable(users) {
    let userTable = ''

    if (users.length > 0) {
        userTable += '<table class="item-table-component">\n'
        userTable += '   <tr>\n'

        for (const key of Object.keys(users[0])) {
            userTable += `       <th>${key}</th>\n`
        }

        userTable += '   </tr>\n'

        for (const user of users) {
            userTable += '   <tr>\n'
            for (const att of Object.values(user)) {
                userTable += '       <td class="user-name">' + att + '</td>\n'
            }
            userTable += '   </tr>\n'
        }
        userTable += '</table>'
    }
    return userTable
}

function readHtmlAndAddNavAndHead(userInfo, filename, scriptHandle=false) {
    return new Promise((resolve, reject) => {
        const script = scriptHandle ? '\n     { script }' : '';
        try {
            fs.readFile(__dirname + '/../html/' + filename, 'utf8', function (err, html) {
                resolve(html.replace('{ navigation }', navigation.createNavigationHTML(userInfo))
                    .replace('{ head }', '<meta charset="UTF-8">\n' +
                        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
                        '    <title>HardwareBay</title>\n' +
                        '    <link rel="stylesheet" type="text/css;charset=utf-8" href="/../css/style.css">\n' +
                        '    <link rel="icon" type="image/x-icon" href="/images/favicon.ico">' + 
                        script 
                        ))
            })
        } catch (err) {
            console.log(err);
            reject(err);
        }
    })
}

function injectScript(userInfo, filename, script){
    return new Promise((resolve, reject) => {
        // TODO: remove readHtmlAndAddNavAndHead and use it in signin instead
       readHtmlAndAddNavAndHead(userInfo, filename, true).then(result => {
           resolve(result.replace('{ script }', htmlParser.parse(script) + '\n'));
       }).catch(err => reject(err));
    })
}

function createPasswordHash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function decodeCookie(cookieValue) {
    const jsonString = Buffer.from(cookieValue, 'base64').toString('ascii');

    if (!checkValidJSON(jsonString)) {
        return { userID: '0000000000', role: 'guest', loggedIn: false };
    }

    const userBacon = JSON.parse(jsonString);
      
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
        const orValue = typeof userBacon[key] === 'string' ? bacon.decode(userBacon[key]).toLowerCase() : userBacon[key];
        userInfo[orKey] = orValue;
    }

    return userInfo;

}

function encodeCookie(cookieName='cookie', cookie={}) {
    let encoded = {};

    for (const key of Object.keys(cookie)) {
        if (typeof cookie[key] === 'string') {
            encoded[bacon.encode(key, {alphabet} )] = bacon.encode(cookie[key]);
        } else {
            encoded[bacon.encode(key, {alphabet} )] = cookie[key];
        }
    }

    return {name: Buffer.from(bacon.encode(cookieName, {alphabet})).toString('base64'), cookie: Buffer.from(JSON.stringify(encoded)).toString('base64')};
}

function checkValidJSON(value='') {
    try {
        JSON.parse(value);
    } catch (err) {
        return false;
    }
    return true;
}

function checkSession(session) {
    const defaultInfo = { userID: '0000000000', role: 'guest', loggedIn: false };

    let userInfo;
    const userCookie = session[getEncodedName()];
    if (userCookie) {
        userInfo = decodeCookie(userCookie);
        userInfo.loggedIn = !moment(session.cookie._expires).isBefore(moment());
    }

    return userInfo ? userInfo : defaultInfo;
}


function getEncodedName() {
    return Buffer.from(bacon.encode('userInfo', {alphabet})).toString('base64')
}

module.exports = {
    buildArticlesTable,
    readHtmlAndAddNav: readHtmlAndAddNavAndHead,
    createPasswordHash,
    checkSession,
    encodeCookie,
    buildUserTable,
    injectScript,
    getEncodedName,
    decodeCookie,
    buildInsecureUserTable,
}
