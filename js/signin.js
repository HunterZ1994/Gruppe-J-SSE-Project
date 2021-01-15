const tools = require("./tools");
const db_connector = require('./database_connection');
const { responseLogging } = require("./interceptor");

const passwordWrong = '<script type="application/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>' +
    '<script type="application/javascript" src="/js/password_wrong.js"></script>'

function getSignin(userInfo) {
    return new Promise((resolve, reject) => {
        console.log(userInfo);
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', ' '));
        }).catch(err => reject(err));
    });
}

function signinErrorWrongPassword(userInfo) {
    return new Promise((resolve, reject) => {
        tools.injectScript(userInfo, "/signin.html", passwordWrong )
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
}


function signinErrorWrongEmail(userInfo) {
    return new Promise((resolve, reject) => {
        tools.injectScript(userInfo, "/signin.html", passwordWrong )
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