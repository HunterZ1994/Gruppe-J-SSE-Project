const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user:'hardwarebay',
    password: '123',
    database: 'hardwarebay',
    port: '3306',
});

function getSearchedArticles(key = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles'
            sql += (key === '') ? ' limit 10' : ' where ArticleName like \'%' + key + '%\''
            con.query({sql: sql})
                .then(rows => {
                    resolve(rows)
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function getUserByUName(username =''){
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from users'
            sql += (username === '') ? ' limit 10' : ' where Email like \'%' + username + '%\''
            con.query({sql: sql})
                .then(rows => {
                    resolve(rows)
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function getArtcileById(articleId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles';
            sql +=  "where ArticleId = " + "'" + articleId + "'";
            con.query({sql}).then(rows => {
                resolve(rows);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function getArtcileByName(articleName='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'select * from articles where articlename LIKE %?%';
            con.query(sql, articleName)
            .then(rows => {
                resolve(rows);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function addArticle(article, userId) {
    return new Promise((resolve, reject) => {
       pool.getConnection().then(con => {
            let sql = 'insert into articles (ArticleName, Descpt, Price, ImagePath, Seller) VALUES (?, ?, ?, ?, ?)'
            const values = [article.articleName, article.descpt, article.price, article.imagePath, userId];
           con.query(sql, values)
           .then(rows => {
               resolve(rows);
           })
           .catch(err => reject(err))
       }).catch(err => reject(err)); 
    });
}

module.exports = {
    getSearchedArticles, getUserByUName, getArtcileById, addArticle, getArtcileByName
}