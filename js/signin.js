const tools = require("./tools");
const db_connector = require('./database_connection');
const { responseLogging } = require("./interceptor");

function getSignin(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', ' '));
        }).catch(err => reject(err));
    });
}

function signinErrorWrongPassword(userInfo) {
    return new Promise((resolve, reject) => {
        tools.injectScript(userInfo, "/signin.html", 
            '<script>window.alert("Username or pasword wrong! Please try again.");</script>')
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
}


function signinErrorWrongEmail(userInfo) {
    return new Promise((resolve, reject) => {
        tools.injectScript(userInfo, "/signin.html",
            '<script>window.alert("User not found! Please try again.");</script>')
            .then(res => resolve(res))
            .catch(err => reject(err));
    });
}

function checkSignIn(email, password){
    return new Promise((resolve, reject) => {
        const pwdHash = tools.createPasswordHash(password);
        db_connector.getUserByUName(email).then(result => {
            const user = result[0];
            let userInfo = {loggedIn: false, userId: "", role: ""};
            if (user) {
                // TODO: need to get rid of toUpperCase()
                if (pwdHash.toUpperCase() === user.PwdHash.toUpperCase() && !user.IsBlocked) {
                    resolve({ loggedIn: true, userId: user.UserId, role: user.Userrole }); 
                } else {
                    signinErrorWrongPassword(userInfo).then(res => reject(res)).catch(err => reject(err));                
                }
            } else {
                signinErrorWrongEmail(userInfo).then(res => reject(res)).catch(err => console.log(err));
            }
        }).catch(err => {
            reject({err, redirect: '/register'});
        });
    });
}

module.exports = {
    getSignin,
    signinErrorWrongPassword,
    signinErrorWrongEmail,
    checkSignIn,
}