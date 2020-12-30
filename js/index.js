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
            // console.log(results[1])
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
                    for(let i of rows) {
                        console.log(i)
                    }
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function buildArticles(articles) {
    return ''
}

module.exports = {
    createIndex,
}