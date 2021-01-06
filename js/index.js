const db_connection = require('./database_connection')
const tools = require('./tools')

const createIndex = (userInfo) => {
    const dbAccess = userInfo.role && userInfo.role === 'vendor' ? db_connection.getArticlesOfVendor(userInfo.userId): 
        db_connection.getSearchedArticles();
    return new Promise((resolve, reject) => {
        Promise.all([tools.readHtmlAndAddNav(userInfo, 'index.html'), dbAccess]).then(results => {
            const articles = tools.buildArticlesTable(results[1], userInfo)
            resolve(results[0].replace('{ articles }', articles))
        })
    })
}

module.exports = {
    createIndex,
}