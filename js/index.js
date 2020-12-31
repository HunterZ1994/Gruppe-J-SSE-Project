const navigation = require('./navigation')
const fs = require('fs')
const db_connection = require('./database_connection')
const tools = require('./tools')

const createIndex = (userInfo) => {
    return new Promise((resolve, reject) => {
        let nav = navigation.createNavigationHTML(userInfo)

        Promise.all([readIndex(nav), db_connection.getSearchedArticles()]).then(results => {
            const articles = tools.buildArticlesTable(results[1])
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

module.exports = {
    createIndex,
}