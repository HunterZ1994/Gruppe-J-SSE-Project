const bacon = require('bacon-cipher');
const db_connector = require('./database_connection');
const tools = require('./tools');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


function decodeRequestCookie(req, res, next) {
    let cookieName = Buffer.from(bacon.encode('userInfo', {alphabet})).toString('base64');
    cookieName = cookieName.substring(0, cookieName.length - 2);
    if (req.cookies[cookieName]) {
        const base64Str = req.cookies[cookieName].substring(2, req.cookies[cookieName].length);
        const userBacon = JSON.parse(Buffer.from(base64Str, 'base64').toString('ascii'));
        
        let userInfo = {};

        for (const key of Object.keys(userBacon)) {
            let orKey = bacon.decode(key, {alphabet}).toLowerCase();
            switch (orKey) {
                case 'userid': 
                    orKey = 'userId'
                    break;
                case 'loggedin': 
                    orKey = 'loggedIn';
                    break;
            }
            const orValue = typeof userBacon[key] === 'string' ? bacon.decode(userBacon[key], {alphabet}).toLowerCase() : userBacon[key];
            userInfo[orKey] = orValue;
        }

        req.cookies = {userInfo};
    }
    next();

}

module.exports = {
    decodeRequestCookie,
}