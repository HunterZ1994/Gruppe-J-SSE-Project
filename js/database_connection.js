const mariadb = require('mariadb');
const security = require('./security');
const pool = mariadb.createPool({
    host: security.IN_PROD ? 'hwb_db' : 'localhost',
    user:'hardwarebay',
    password: '123',
    database: 'hardwarebay',
    port: '3306',
    multipleStatements: true,
    connectionLimit: 15
});

//#region articles

function getSearchedArticles(key = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from Articles'
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
            const sql = 'SELECT * FROM Articles WHERE ArticleId = ?';
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
            const sql = 'select * from Articles where ArticleName LIKE %?%';
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
            const sql = 'SELECT * FROM Articles WHERE Seller = ?'
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
            const sql = 'insert into Articles (ArticleName, Descpt, Price, ImagePath, Seller) VALUES (?, ?, ?, ?, ?)'
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
            const sql = "UPDATE Articles SET ArticleName = ?, Descpt = ?, Price = ?, ImagePath = ? WHERE ArticleId = ?"
            const values = [article.articleName, article.descpt, article.price, article.imagePath, article.articleId];
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
            const sql = "DELETE FROM Holds WHERE Article = ?; DELETE FROM Comments WHERE Article = ?; DELETE FROM Articles WHERE ArticleId = ?";
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
                console.log(err);
                reject(err)
                con.end()
            });
        }).catch(err => reject(err));
    });
}

function getCommentsOfArticle(articleId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "SELECT FirstName, ComText FROM (Comments INNER JOIN Articles ON Comments.Article = Articles.ArticleId) INNER JOIN Users ON Comments.User = Users.UId WHERE Article = ?";
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

//#endregion

// #region user

function getAllUsers() {
    return new Promise((resolve, reject) => {
        pool.getConnection()
            .then(con => {
                const sql = 'SELECT * FROM Users';
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

function blockUser(userId) {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            const sql = "UPDATE Users SET Blocked = ? WHERE UId = ?"
            con.query(sql, [true, userId]).then(res => {
                resolve(res)
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
            const sql = "DELETE FROM Users WHERE UId = ?";
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

function getUserById(userId = ''){
    return new Promise((resolve, reject) => {
        pool.getConnection()
        .then(con => {
            const sql = 'SELECT * FROM Users WHERE UId = ?';
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

function getUserByUName(username ='') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from Users'
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
            con.query('SELECT COUNT(*) AS UserCount FROM Users').then(rows => {
                const UId = Date.now() + (!!rows[0].UserCount ? rows[0].UserCount: 0) + 13417;
                const sql = 'INSERT INTO Users (UId, Email , FirstName, SureName, Street , HouseNr, PostCode, City, Userrole, PwdHash, SecQuestion, SecAnswer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                const values = [UId, user.email, user.firstName, user.sureName, user.street, user.houseNr, user.postalCode, user.city, 'customer', user.pwHash, user.security_question, user.secAnswerHash];
                con.query(sql, values).then(rows => {
                    con.end()
                    resolve(rows);
                }).catch(err => {
                    con.end()
                    reject(err)
                })
            }).catch(err => {
                con.end()
                reject(err)
            })
        }).catch(err => reject(err))
    });
}

function checkIfEmailExists(user) {
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con =>{
            let sql = 'select * from Users where Email = ?';
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

function getSecQuestionByEmail(email = '') {
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select SecQuestion from Users where Email like ?'
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
            let sql = 'select count(UserId) as found from Users where Email = ? and SecAnswer = ?';
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
            let sql = 'update Users set PwdHash = ? WHERE Email = ?'
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
            const sql = 'SELECT * FROM Carts WHERE User = ?';
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
            const sql = "SELECT * FROM Holds INNER JOIN Articles ON Articles.ArticleId = Holds.Article WHERE Cart = ?"
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
            const sql = 'INSERT INTO Carts (User) VALUES (?)'
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
            const sql = 'INSERT INTO Holds (Cart, Article, ArticleAmount) VALUES (?, ?, ?)'
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
            const sql = "DELETE FROM Holds WHERE Cart = ? AND Article = ?;"
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
            const sql = "DELETE FROM Holds WHERE Cart = ?;"
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
    getCommentsOfArticle,
    addUser,
    checkIfEmailExists,
    getAllUsers,
    getUserById,
    deleteUser,
    blockUser,
    getCartByUserId,
    getCartArticles,
    createCart,
    addArticleToCart,
    deletreArticleFromCart,
    getSeqQuestionByEmail: getSecQuestionByEmail,
    checkSecurityAnswer,
    changePassword,
    clearCart
}
