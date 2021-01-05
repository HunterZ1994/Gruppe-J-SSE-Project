const bacon = require('bacon-cipher');
const db_connector = require('./database_connection');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


async function decodeRequestCookie(req, res, next) {
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
        
        const dbUserInfo = await db_connector.getUserById(userInfo.userId);

        if (userInfo.role !== dbUserInfo[0].Userrole) {
            console.log('##### Boooom someone tried to hack me! #########');
            userInfo.role = dbUserInfo.Role;
        }

        req.cookies  = {userInfo};
    }
    next();

}

function encodeCookie(cookieName='cookie', cookie) {
    let encoded = {};

    for (const key of Object.keys(cookie)) {
        if (typeof cookie[key] === 'string') {
            encoded[bacon.encode(key, {alphabet})] = bacon.encode(cookie[key], {alphabet});
        } else {
            encoded[bacon.encode(key, {alphabet})] = cookie[key];
        }
    }

    return {name: Buffer.from(bacon.encode(cookieName, {alphabet})).toString('base64'), cookie: Buffer.from(JSON.stringify(encoded)).toString('base64')};
}

module.exports = {
    decodeRequestCookie,
    encodeCookie
}