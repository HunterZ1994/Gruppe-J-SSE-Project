const db_connector = require('./database_connection');
const tools = require('./tools');

function createCart(userInfo) {
    return new Promise((resolve, reject) => {
        Promise.all([
           tools.readHtmlAndAddNav(userInfo, 'cart.html'),
           db_connector.getCartByUserId(userInfo.userId)
        ]).then(results => {
            db_connector.getCartArticles(results[1][0].CartId)
            .then(articles => {
                const table = tools.buildArticlesTable(articles);
                const buyButton = articles.length > 0 ?
                    '<Button id=\'checkout_button\' value="Go to checkout" onclick="window.location.href = \'checkout\'">Kaufen</Button>' :
                    '';
                resolve(results[0].replace('{ articles }', table).replace('{ buy_button }', buyButton)
                    .replace('No products matching search criteria', 'Your cart is currently empty'));
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    });
}


function addToCart(userInfo, articleId) {
    return new Promise((resolve, reject) => {
        const userId = userInfo.userId
        db_connector.getCartByUserId(userId)
        .then(res => {
            if (!res[0]) {
                db_connector.createCart(userId)
                .then(res => {
                    db_connector.addArticleToCart(res.insertId, articleId, 1)
                    .then(() => resolve(true))
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
                })
                .catch();
            } else {
                db_connector.addArticleToCart(res[0].CartId, articleId, 1)
                .then(() => resolve(true))
                .catch(err => {
                    console.log(err);
                    resolve(false);
                });
            }
        }).catch(err =>{ 
            console.log(err)
            resolve(false);
        });
    });
}

function deleteFromCart(userInfo, articleId ) {
    return new Promise((resolve, reject) => {
        db_connector.getCartByUserId(userInfo.userId)
        .then(rows =>{
            const cartId = rows[0].CartId;
            db_connector.deletreArticleFromCart(cartId, articleId)
            .then(res => resolve(res))
            .catch(err => {
                console.log(err);
                reject(err);
            });
        })
        .catch(err => {
            console.log(err);
            reject(err);
        });
    });
} 


module.exports = {
    createCart,
    addToCart,
    deleteFromCart
}