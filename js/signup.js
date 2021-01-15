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
        user.secAnswerHash = tools.createPasswordHash(user.security_answer)
        db_connector.checkIfEmailExists(user).then(result => {
            if (Object.keys(result).length > 1) {
                resolve(signinErrorUserExists(user));
            } else {
                db_connector.addUser(user).then(result => {
                    if (result.warningStatus === 0) {
                        return new Promise((resolve, reject) => {
                            tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
                                resolve(result.replace('{ script }', ""));
                            }).catch(err => reject(err));
                        });
                    } else {
                        resolve(signinErrorUserExists(user));
                    }
                }).catch(err =>{
                    reject(err);
                });
            }
        }).catch(err => {
            console.log(err);
        })

    });
}

module.exports = {
            getSignup,
            signinErrorUserExists,
            checkSignUp,
        }