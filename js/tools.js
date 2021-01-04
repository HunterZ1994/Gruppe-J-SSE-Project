const navigation = require('./navigation')
const fs = require('fs')
const crypto = require('crypto');

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
        for(let article of articles) {
            artTable += '   <tr>\n'
            artTable += '       <td><a href="/product?articleId=' + article.ArticleId + '">' + article.ArticleName + '</a></td>\n'
            artTable += '       <td>' + article.Descpt + '</td>\n'
            artTable += '       <td>' + article.Price + '$</td>\n'
            artTable += '       <td><img src="' + article.ImagePath
                + '" style="max-height: 150px; max-width: 150px;"></td>\n'

            if (userInfo.role === 'vendor') {
                artTable += `<td> <a href='article/edit?articleId=${article.ArticleId}'> Bearbeiten </a> </td>\n`; 
                artTable += `<td> <a href='article/delete?articleId=${article.ArticleId}'> Löschen </a> </td>\n`; 
            }

            artTable += '   </tr>\n'
        }
        
        if (userInfo.role === 'vendor') {
            artTable += '<tr>\n';
            artTable += '<td> <a href="article/add"> Hinzufügen </a> </td>';
            artTable += '</tr>\n'

        }

        artTable += '</table>'
    }
    else {
        artTable = 'No products matching search criteria'
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


module.exports = {
    buildArticlesTable,
    readHtmlAndAddNav,
    createPasswordHash,
}