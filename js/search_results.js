const db_connection = require('./database_connection')
const tools = require('./tools')

const createSearchResults = (userInfo, key) => {
    return new Promise((resolve, reject) => {
        Promise.all([tools.readHtmlAndAddNav(userInfo, 'search_results.html'),
            db_connection.getSearchedArticles(key)]).then(results => {
            const articles = tools.buildArticlesTable(results[1], userInfo)
            resolve(results[0].replace('{ articles }', articles).replace('{ key }', key))
        }).catch(err => reject(err))
    })
}

module.exports = {
    createSearchResults,
}