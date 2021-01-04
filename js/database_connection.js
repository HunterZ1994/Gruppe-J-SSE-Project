const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user:'hardwarebay',
    password: '123',
    database: 'hardwarebay',
    port: '3306',
});

//#region articles

function getSearchedArticles(key = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles'
            sql += (key === '') ? ' limit 10' : ' where ArticleName like ?'
            con.query(sql, `'%${key}%'`)
                .then(rows => {
                    resolve(rows)
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function getArtcileById(articleId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'SELECT * FROM articles WHERE articleId = ?';
            con.query(sql, articleId).then(rows => {
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

function getArticlesOfVendor(userId = 0) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'SELECT * FROM articles  WHERE Seller = ?'
            con.query(sql, userId)
            .then(res => resolve(res))
            .catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function addArticle(article, userId) {
    return new Promise((resolve, reject) => {
       pool.getConnection().then(con => {
            const sql = 'insert into articles (ArticleName, Descpt, Price, ImagePath, Seller) VALUES (?, ?, ?, ?, ?)'
            const values = [article.articleName, article.descpt, article.price, article.imagePath, userId];
           con.query(sql, values)
           .then(rows => {
               resolve(rows);
           })
           .catch(err => reject(err))
       }).catch(err => reject(err)); 
    });
}

function updateArticle(article) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "UPDATE articles SET articleName = ?, descpt = ?, Price = ?, imagePath = ? WHERE articleId = ?"
            const values = [article.ArticleName, article.Descpt, article.Price, article.ImagePath, article.ArticleId];
            con.query(sql, values).then(res => resolve(res)).catch(err => reject(err)); 
        }).catch(err => reject(err));
    });
}

function deleteArticle(articleId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "DELETE FROM articles WHERE articleId = ?";
            con.query(sql, articleId).then(res => resolve(res)).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

//#endregion

//#region comments

function addArticleComment(comment, articleId, userId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "INSERT INTO Comments (ComText, Article, User) VALUES (?, ?, ?)"
            const values = [comment, articleId, userId];
            con.query(sql, values).then(res => resolve(res)).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function getCommentsOfArticle(articleId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "SELECT * FROM comments WHERE article = ?";
            con.query(sql, articleId).then(res => resolve(res)).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function getCommentsOfUser(userId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "SELECT * FROM comments WHERE user = ?";
            con.query(sql, userId).then(res => resolve(res)).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

//#endregion

// #region user

function getAllUsers() {
    return new Promise((resolve, reject) => {
        pool.getConnection()
            .then(con => {
                const sql = 'SELECT * FROM users';
                con.query(sql).then(rows => {
                    resolve(rows);
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
        });
    });
}

function getUserById(userId = ''){
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(con => {
            const sql = 'SELECT * FROM users WHERE UserId = ?';
            con.query(sql, userId)
            .then(rows => {
                resolve(rows);
            }).catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
}

function getUserByEmail(userEmail ='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
            .then(con => {
                const sql = 'SELECT * FROM users WHERE user.Email = ?';
                con.query(sql, userEmail)
                    .then(rows => resolve(rows))
                    .catch(err => reject(err));
            })
            .catch(err => {
                reject(err);
            });
    });
}

function getUserByUName(username =''){
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from users'
            sql += (username === '') ? ' limit 10' : ' where Email like \'%' + username + '%\''
            con.query({sql: sql})
                .then(rows => {
                    resolve(rows)
                }).catch(err => reject(err))
        }).catch(err => reject(err))
    })
}

function addUser(user){
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con => {
            let sql = 'INSERT INTO users (Email , FirstName, SureName, Street , HouseNr, PostCode, City, Userrole, PwdHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            const values = [user.email, user.firstName, user.sureName, user.street, user.houseNr, user.postalCode, user.city, 'customer', user.pwHash];
            con.query(sql, values, (err, data) =>{}).then(rows => {
                resolve(rows);
            }).catch(err => reject(err))
        }).catch(err => reject(err))
    });
} 

function checkIfEmailExists(user){
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con =>{
            let sql = 'select * from users where Email = ?';
            con.query(sql, user.email).then(rows =>{
                resolve(rows);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    }).catch(err => console.log(err));
}

//#endregion

module.exports = {
    getSearchedArticles, 
    getUserByUName, 
    getArtcileById, 
    addArticle, 
    updateArticle,
    deleteArticle,
    getArtcileByName,
    getArticlesOfVendor, 
    addArticleComment,
    getCommentsOfUser,
    getCommentsOfArticle,
    addUser,
    checkIfEmailExists,
    getAllUsers,
    getUserById,
    getUserByEmail

}
