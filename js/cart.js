const navigation = require('./navigation')
const fs = require('fs')
const db_conector = require('./database_connection');

console.log("cart script loaded")

const createCart = (userInfo) => {
    return new Promise((resolve, reject) => {
        let nav = navigation.createNavigationHTML(userInfo)

        Promise.all([readCart(nav), db_conector.getArticleWithID()]).then(results => {
            const articles = buildArticles(results[1])
            resolve(results[0].replace('{ articles }', articles))
        })
    })
}

function readCart(nav) {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/../html/cart.html', 'utf8', function (err, html) {
            if (err) {
                throw err
            }
            resolve(html.replace('{ navigation }', nav))
        })
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

function goToCheckout(){
    // window.alert("Going to checkout");
    console.log("Going to checkout!")
}


module.exports = {
    createCart,
}