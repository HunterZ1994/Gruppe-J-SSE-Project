const { resolve4 } = require('dns');
const fs = require('fs')
const db_conector = require('./database_connection');
const tools = require('./tools');

function createCart(userInfo) {
    return new Promise((resolve, reject) => {
        Promise.all([
           tools.readHtmlAndAddNav(userInfo, 'cart.html'),
           db_conector.getCartByUserId(userInfo.userId)
        ]).then(results => {
            db_conector.getCartArticles(results[1][0].CartId)
            .then(articles => {
                const table = tools.buildArticlesTable(articles);
                resolve(results[0].replace('{ articles }', table));
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
        db_conector.getCartByUserId(userId)
        .then(res => {
            if (!res[0]) {
                db_conector.createCart(userId)
                .then(res => {
                    db_conector.addArticleToCart(res.insertId, articleId, 1)
                    .then(resolve(true))
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
                })
                .catch();
            } else {
                db_conector.addArticleToCart(res[0].CartId, articleId, 1)
                .then(resolve(true))
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
        db_conector.getCartByUserId(userInfo.userId)
        .then(rows =>{
            const cartId = rows[0].CartId;
            db_conector.deletreArticleFromCart(cartId, articleId)
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