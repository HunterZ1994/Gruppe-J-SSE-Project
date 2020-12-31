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

function addUser(email, pwordhash, firstName, lastName, street, houseNr, postalCode){
    return new Promise((resolve, reject) =>{
        pool.getConnection().then(con => {
            let sql = 'INSERT INTO users (Email , FirstName, SureName, Street , HouseNr, City, PostCode, Userrole, PwdHash)'
            sql += `VALUES ('${email}', '${firstName}', '${lastName}', '${street}', '${houseNr}', '${postalCode}', 'customer', '${pwordhash}');`
            con.query({sql: sql}).then(rows => {
                resolve(rows)
            }).catch(err => console.log(err))
        }).catch(err => reject(err))
    });
}

module.exports = {
    getSearchedArticles, getUserByUName,
}