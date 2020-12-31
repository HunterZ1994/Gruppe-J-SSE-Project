const mariadb = require('mariadb');
const express = require('express');
const pool = mariadb.createPool({
     host: 'localhost',
     port: 3306, 
     user:'root', 
     password: 'Westernby1994',
     database: 'hardwarebay',
});

// pool.getConnection().then(conn =>{
//     conn.query("SELECT * FROM users;")
//     .then((rows) =>{
//         console.log(rows);
//     }).catch(err =>{
//         console.log(err);
//         conn.end();
//     }) 
// }).catch(err => {
//     //not connected
//     console.log(err);
//   });

function getArticleWithID(id = ''){
    return new Promise((resolve, reject) => {
        pool.getConnection().then(con => {
            let sql = 'select * from articles'
            sql += (id === '') ? '' : ' where \'ArticleName\' like \'%' + id + '%\''
            con.query({sql: sql})
                .then(rows => {
                    con.end()
                    resolve(rows)
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

module.exports = {
    getArticleWithID,
}