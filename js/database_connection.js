const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user:'hardwarebay',
    password: '123',
    database: 'hardwarebay',
    port: '3306',
    multipleStatements: true
});

//#region articles

function getSearchedArticles(key = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles'
            sql += (key === '') ? ' limit 10' : ' where ArticleName like ?'
            con.query(sql, `%${key}%`)
                .then(rows => {
                    resolve(rows)
                    con.end()
                }).catch(err => {
                    reject(err)
                    con.end()
                })
        }).catch(err => reject(err))
    })
}

function getArticleById(articleId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'SELECT * FROM articles WHERE articleId = ?';
            con.query(sql, articleId).then(rows => {
                resolve(rows);
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getArticleByName(articleName='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'select * from articles where ArticleName LIKE %?%';
            con.query(sql, articleName)
            .then(rows => {
                resolve(rows);
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getArticlesOfVendor(userId = 0) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = 'SELECT * FROM articles  WHERE Seller = ?'
            con.query(sql, userId)
            .then(res => {
                resolve(res);
                con.end()
            })
            .catch(err => {
                reject(err)
                con.end()
            });
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
               con.end()
           }).catch(err => {
               reject(err)
               con.end()
           })
       }).catch(err => {
           console.log(err);
           reject(err);
       }); 
    });
}

function updateArticle(article) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "UPDATE articles SET articleName = ?, descpt = ?, Price = ?, imagePath = ? WHERE articleId = ?"
            const values = [article.ArticleName, article.Descpt, article.Price, article.ImagePath, article.ArticleId];
            con.query(sql, values).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function deleteArticle(articleId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "DELETE FROM holds WHERE Article = ?; DELETE FROM comments WHERE Article = ?; DELETE FROM articles WHERE ArticleId = ?";
            con.query(sql, [articleId, articleId, articleId]).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
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
            con.query(sql, values).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getCommentsOfArticle(articleId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "SELECT * FROM comments WHERE article = ?";
            con.query(sql, articleId).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getCommentsOfUser(userId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "SELECT * FROM comments WHERE user = ?";
            con.query(sql, userId).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
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
                    resolve(rows)
                    con.end()
                }).catch(err => {
                    reject(err)
                    con.end()
                });
            }).catch(err => reject(err));
    });
}

function deleteUser(userId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "DELETE FROM users WHERE UserId = ?";
            con.query(sql, [articleId, userId]).then(res => {
                resolve(res)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
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
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getUserByEmail(userEmail ='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
            .then(con => {
                const sql = 'SELECT * FROM users WHERE user.Email = ?';
                con.query(sql, userEmail)
                    .then(rows => {
                        resolve(rows)
                        con.end()
                    })
                    .catch(err => {
                        reject(err)
                        con.end()
                    });
            }).catch(err => reject(err));
    });
}

function getUserByUName(username ='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from users'
            sql += (username === '') ? ' limit 10' : ' where Email like \'%' + username + '%\''
            con.query({sql: sql})
                .then(rows => {
                    resolve(rows)
                    con.end()
                }).catch(err => {
                reject(err)
                con.end()
            })
        }).catch(err => reject(err))
    })
}

function addUser(user) {
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con => {
            let sql = 'INSERT INTO users (Email , FirstName, SureName, Street , HouseNr, PostCode, City, Userrole, PwdHash, SecQuestion, SecAnswer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            const values = [user.email, user.firstName, user.sureName, user.street, user.houseNr, user.postalCode, user.city, 'customer', user.pwHash, user.security_question, user.secAnswerHash];
            con.query(sql, values).then(rows => {
                resolve(rows);
            }).catch(err => {
                reject(err)
                con.end()
            })
        }).catch(err => reject(err))
    });
} 

function checkIfEmailExists(user) {
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con =>{
            let sql = 'select * from users where Email = ?';
            con.query(sql, user.email).then(rows => {
                resolve(rows)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    }).catch(err => console.log(err));
}

function isValidUserID(user){
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con =>{
            let sql = 'select * from users where UserId = ?';
            con.query(sql, user.userID).then(rows => {
                resolve(rows)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getSecQuestionByEmail(email = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select SecQuestion from users where Email like ?'
            con.query(sql, email)
                .then(rows => {
                    resolve(rows)
                    con.end()
                }).catch(err => {
                reject(err)
                con.end()
            })
        }).catch(err => reject(err))
    })
}

function checkSecurityAnswer(email, answer) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select count(UserId) as found from users where Email = ? and SecAnswer = ?';
            con.query(sql, [email, answer]).then(rows => {
                resolve(rows)
                con.end()
            }).catch(err => {
                reject(err)
                con.end()
            });
        }).catch(err => reject(err))
    })
}

function changePassword(email, password) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'update users set PwdHash = ? WHERE Email = ?'
            con.query(sql, [password, email])
                .then(rows => {
                    resolve()
                    con.end()
                }).catch(err => {
                reject(err)
                con.end()
            })
        }).catch(err => reject(err))
    })
}

//#endregion

function getCartByUserId(userId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(conn => {
            const sql = 'SELECT * FROM carts WHERE User = ?';
            conn.query(sql, userId)
            .then(rows => {
                resolve(rows);
                conn.end();
            })
            .catch(err => {
                console.log(err);
                reject(err);
                conn.end();
            });
        })
        .catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

function getCartArticles(cartId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(conn => {
            const sql = "SELECT * FROM holds INNER JOIN articles ON articles.ArticleId = holds.Article WHERE cart = ?"
            conn.query(sql, cartId)
            .then(rows => {
                resolve(rows);
                conn.end();
            })
            .catch(err => {
                console.log(err);
                reject(err);
                conn.end();
            });
        })
        .catch(err => {
             console.log(err);
             reject(err);
        });
    });
}

function createCart(userId='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(conn => {
            const sql = 'INSERT INTO carts (User) VALUES (?)'
            conn.query(sql, userId)
            .then(rows => {
                resolve(rows)
                conn.end();
            })
            .catch(err => {
                console.log(err);
                reject(err);
                conn.end();
            });
        }).catch(err => {
                console.log(err);
                reject(err);
        });
    });
}

function addArticleToCart(cartId = '', articleId = '', amount='') {
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(conn => {
            const sql = 'INSERT INTO holds (Cart, Article, ArticleAmount) VALUES (?, ?, ?)'
            conn.query(sql, [cartId, articleId, amount])
            .then(rows => {
                resolve(rows)
                conn.end();
            })
            .catch(err => {
                console.log(err);
                reject(err);
                conn.end()
            });
        }).catch(err => {
                console.log(err);
                reject(err);
        });
    });
}

function deletreArticleFromCart(cartId, articleId) {
    return new Promise((resolve, reject) => { 
        pool.getConnection()
        .then(conn => {
            const sql = "DELETE FROM holds WHERE Cart = ? AND Article = ?;"
            conn.query(sql, [cartId, articleId])
            .then(rows => {
                conn.end();
                resolve(rows)
            })
            .catch(err => {
                conn.end();
                console.log(err);
                reject(err);
            });
        }).catch(err => {
                console.log(err);
                reject(err);
        });
    });
}

function clearCart(cartId='') {
    return new Promise((resolve, reject) => { 
        pool.getConnection()
        .then(conn => {
            const sql = "DELETE FROM holds WHERE Cart = ?;"
            conn.query(sql, [cartId])
            .then(rows => {
                conn.end();
                resolve(rows)
            })
            .catch(err => {
                conn.end();
                console.log(err);
                reject(err);
            });
        }).catch(err => {
                console.log(err);
                reject(err);
        });
    });
}

module.exports = {
    getSearchedArticles, 
    getUserByUName, 
    getArtcileById: getArticleById,
    addArticle, 
    updateArticle,
    deleteArticle,
    getArtcileByName: getArticleByName,
    getArticlesOfVendor, 
    addArticleComment,
    getCommentsOfUser,
    getCommentsOfArticle,
    addUser,
    checkIfEmailExists,
    getAllUsers,
    getUserById,
    getUserByEmail,
    deletUser;
    getCartByUserId,
    getCartArticles,
    createCart,
    addArticleToCart,
    deletreArticleFromCart,
    isValidUserID,
    getSeqQuestionByEmail: getSecQuestionByEmail,
    checkSecurityAnswer,
    changePassword,
    clearCart
}
