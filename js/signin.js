const tools = require("./tools");
const db_connector = require('./database_connection');

function getSignin(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', ' '));
        }).catch(err => reject(err));
    });
}

function SigninErrorWrongPassword(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', '<script>window.alert("Username or pasword wrong! Please try again.);</script> '));
        }).catch(err => reject(err));
    });
}


function SigninErrorWrongEmail(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', '<script>window.alert("User not found! Please try again.);</script> '));
        }).catch(err => reject(err));
    });
}

function checkSignIn(email, password){
    return new Promise((resolve, reject) => {
        const dbpwd = tools.createPasswordHash(password);
        db_connector.getUserByUName(email).then(result => {
            let userInfo = {loggedIn: false, userId: "", role: ""};
            if (Object.keys(result).length > 1) {
                const users = result[0];
                if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase() && !users.Blocked) {
                    userInfo = { loggedIn: true, userId: users.UserId, role: users.Userrole }
                }
            }
            if (userInfo.loggedIn) {
                resolve(userInfo);
            } else {
                tools.injectScript(userInfo, "/signin.html", 
                    "<script>window.alert('Username or password wrong! Please try agaim. );</script>"
                ).then(result =>{
                    reject(result);
                }).catch(err => {
                    reject(err);
                })
            }
        }).catch(err => {
            reject({err, redirect: '/register'});
        });
    });         
}

module.exports = {
    getSignin,
    SigninErrorWrongPassword,
    SigninErrorWrongEmail,
    checkSignIn,
}