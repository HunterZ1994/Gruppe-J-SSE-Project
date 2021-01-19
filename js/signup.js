const tools = require("./tools");
const db_connector = require('./database_connection');
const { responseLogging } = require("./interceptor");

const passwordWrong = '<script type="application/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>' +
    '<script type="application/javascript" src="js/check_signup_form.js"></script>'
const UserExistsErrorScript = '<script type="application/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>' +
'<script type="application/javascript" src="js/User_already_exists.js"></script>'

function getSignup(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signup.html").then(result => {
            resolve(result.replace('{ script }', passwordWrong));
        }).catch(err => reject(err));
    });
}

function signinErrorUserExists(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', UserExistsErrorScript));
        }).catch(err => reject(err));
    });
}


function checkSignUp(user) {
    return new Promise((resolve, reject) => {
        user.pwHash = tools.createPasswordHash(user.password);
        user.secAnswerHash = tools.createPasswordHash(user.security_answer);
        let userInfo = { userID: '0000000000', role: 'guest', loggedIn: false };
        db_connector.checkIfEmailExists(user).then(result => {
            if (Object.keys(result).length > 1) {
                resolve(signinErrorUserExists(user));
            } else {
                db_connector.addUser(user).then(result => {
                    if (result.warningStatus === 0) {
                        db_connector.getUserByUName(user.email)
                        .then(users => {
                            const newUser = users[0];
                            resolve({loggedIn: true, userId: newUser.UId, role: newUser.Userrole });
                        }).catch(err => {
                            console.log(err);
                            resolve({err, redirect: '/login'});
                        });
                        tools.readHtmlAndAddNav(userInfo, "/signin.html")
                            .then(result => {
                                resolve(result.replace('{ script }', ""));
                            }).catch(err => {
                                reject({err, redirect: '/register'});
                            });
                    } else {
                        signinErrorUserExists(userInfo).then(res => resolve(res)).catch(err => reject(err))
                    }
                }).catch(err =>{
                    console.log(err);
                    reject(err);
                });
            }
        }).catch(err => {
            signinErrorUserExists(userInfo).then(res => resolve(res)).catch(err => reject(err))
        })

    });
}

module.exports = {
            getSignup,
            checkSignUp,
        }