const db_connection = require('./database_connection')
const tools = require('./tools')

const createIndex = (userInfo) => {
    return new Promise((resolve, reject) => {
        Promise.all([tools.readHtmlAndAddNav(userInfo, 'index.html'),
            db_connection.getSearchedArticles()]).then(results => {
            const articles = tools.buildArticlesTable(results[1])
            resolve(results[0].replace('{ articles }', articles))
        })
    })
}

module.exports = {
    createIndex,
}