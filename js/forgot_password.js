const db_connection = require('./database_connection')
const tools = require('./tools')
const emailNotFound = '<script type="application/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>' +
    '<script type="application/javascript" src="/js/forgot_pw_message.js"></script>'

const createForgotPwInput = (userInfo, script='') => {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, 'forgot_pw_input.html').then(result => {
            resolve(result.replace('{ script }', script))
        }).catch(err => {
            console.log(err)
            reject(err)
        })
    })
}

const createForgotPassword = (userInfo) => {
    const secQuestion = db_connection.getSeqQuestionByEmail(userInfo.email);
    return new Promise((resolve, reject) => {
        Promise.all([tools.readHtmlAndAddNav(userInfo, 'forgot_password.html'), secQuestion])
            .then(results => {
                if (!!results[1][0] && !!results[1][0].SecQuestion) {
                    resolve(results[0].replace('{ question }', results[1][0].SecQuestion).replace('{ script }', '')
                        .replace('{ email }', userInfo.email));
                } else {
                    createForgotPwInput(userInfo, emailNotFound).then(page => {
                        resolve(page);
                    })
                }
            }).catch(err => {
            console.log(err)
            reject(err)
        })
    })
}

const changePassword = (userInfo) => {
    const checkAnswer = db_connection.checkSecurityAnswer(userInfo.email, userInfo.security_answer);
    return new Promise((resolve, reject) => {
        checkAnswer.then(result => {
            if (result[0].found > 0 ) {
                db_connection.changePassword(userInfo.email, userInfo.new_password).then(() => resolve(true))
            } else {
                resolve(false)
            }
        }).catch(err => {
            console.log(err)
            reject(err)
        })
    })
}

module.exports = {
    createForgotPassword,
    createForgotPwInput,
    changePassword,
}