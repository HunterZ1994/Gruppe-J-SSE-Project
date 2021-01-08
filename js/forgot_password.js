const db_connection = require('./database_connection')
const tools = require('./tools')

const createForgotPwInput = (userInfo, script='') => {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, 'forgot_pw_input.html').then(result => {
            resolve(result.replace('{ script }', script))
        })
    })
}

const createForgotPassword = (userInfo, script='') => {
    const secQuestion = db_connection.getSeqQuestionByEmail(userInfo.email);
    return new Promise((resolve, reject) => {
        Promise.all([tools.readHtmlAndAddNav(userInfo, 'forgot_password.html'), secQuestion])
            .then(results => {
                if (!!results[1][0] && !!results[1][0].SecQuestion) {
                    resolve(results[0].replace('{ question }', results[1][0].SecQuestion).replace('{ script }', '')
                        .replace('{ email }', userInfo.email));
                } else {
                    createForgotPwInput(userInfo, '<script type="application/javascript;charset=utf-8" src="/js/forgot_password.js"></script>').then(page => {
                        resolve(page);
                    })
                }
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
        })
    })
}

module.exports = {
    createForgotPassword,
    createForgotPwInput,
    changePassword,
}