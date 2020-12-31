const navigation = require('./navigation')
const fs = require('fs')

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user:'hardwarebay',
    password: '123',
    database: 'hardwarebay',
    port: '3306',
});

const createIndex = (userInfo) => {
    return new Promise((resolve, reject) => {
        let nav = navigation.createNavigationHTML(userInfo)

        Promise.all([readIndex(nav), getSearchedArticles()]).then(results => {
            const articles = buildArticles(results[1])
            resolve(results[0].replace('{ articles }', articles))
        })
    })
}

function readIndex(nav) {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/../html/index.html', 'utf8', function (err, html) {
            if (err) {
                throw err
            }
            resolve(html.replace('{ navigation }', nav))
        })
    })
}

function getSearchedArticles(key = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles'
            sql += (key === '') ? '' : ' where \'ArticleName\' like \'%' + key + '%\''
            con.query({sql: sql})
                .then(rows => {
                    con.end()
                    resolve(rows)
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function buildArticles(articles) {
    let artTable = '<table>\n'
    artTable += '   <tr>\n'
    artTable += '       <th>Name</th>\n'
    artTable += '       <th>Description</th>\n'
    artTable += '       <th>Price</th>\n'
    artTable += '       <th>Image</th>\n'
    artTable += '   </tr>\n'
    for(let article of articles) {
        artTable += '   <tr>\n'
        artTable += '       <td><a href="/product/' + article.ArticleId + '">' + article.ArticleName + '</a></td>\n'
        artTable += '       <td>' + article.Descpt + '</td>\n'
        artTable += '       <td>' + article.Amount + '$</td>\n'
        artTable += '       <td><img src="' + article.ImagePath
            + '" style="max-height: 150px; max-width: 150px;"></td>\n'
        artTable += '   </tr>\n'
    }
    artTable += '</table>'
    return artTable
}

module.exports = {
    createIndex,
}