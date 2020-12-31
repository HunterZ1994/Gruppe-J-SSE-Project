const navigation = require('./navigation')
const fs = require('fs')
const db_connection = require('./database_connection')
const tools = require('./tools')

const createSearchResults = (userInfo, key) => {
    return new Promise((resolve, reject) => {
        let nav = navigation.createNavigationHTML(userInfo)

        Promise.all([readSearchResults(nav), db_connection.getSearchedArticles(key)]).then(results => {
            const articles = tools.buildArticlesTable(results[1])
            resolve(results[0].replace('{ articles }', articles).replace('{ key }', key))
        })
    })
}

function readSearchResults(nav) {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/../html/search_results.html', 'utf8', function (err, html) {
            if (err) {
                throw err
            }
            resolve(html.replace('{ navigation }', nav))
        })
    })
}

module.exports = {
    createSearchResults,
}