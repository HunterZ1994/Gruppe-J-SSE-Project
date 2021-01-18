const bacon = require('bacon-cipher');
const security = require('./security');
const fs = require('fs');
const htmlParser = require('node-html-parser');
const tools = require('./tools');

function decodeRequestCookie(req, res, next) {
    const cookieName = tools.getEncodedName().replace(/=/g, '');
    if (req.cookies[cookieName]) {
        const userInfo = tools.decodeCookie(req.cookies[cookieName].replace(/=/g, ''));
        req.cookies['userInfo'] = userInfo;
    }
    next();
}

function allowXSS(req, res, next) {
    // needs to be diabled for XXS
    if (req.path.toLowerCase().includes('product')) {
        res.removeHeader(security.securityHeaders.contentSecurityPolicy.name);
    }
    next();
}

function appendCSRFToken(req, res, next) {
    const oldSend = res.send;
    const csrfToken = req.csrfToken();
    const csrf = `<input type="hidden" name="_csrf" value="${csrfToken}"/>`;
    res.send = function(data) {
        const root = htmlParser.parse(data);
        if (req.path.toLowerCase().includes('article') && req.method === 'GET') {
            root.querySelector('#form').setAttribute('action', root.querySelector('#form').getAttribute('action') + `/?_csrf=${csrfToken}`);
            content = root.toString();
        }
        oldSend.apply(res, [root.toString().replace('{ csrf }', csrf)]);
    }  

    res.sendFile = function(data) {
        const str = fs.readFileSync(data, 'utf-8');
        oldSend.apply(res, [str.replace('{ csrf }', csrf)]);
    }

    next();
}


function responseLogging(res, req, next, config = {field: 'headers'}) {
    console.log("\n\n### Response Logger ###\n");
    if (config && config.field !== '') {
        console.log(`### Logging: [${config.field}] ###\n`);
        console.log(res[config.field]);
        console.log("\n");
    } else {
        console.log(`### Logging: res ###\n`);
        console.log(res);
        console.log("\n");
    }
    console.log('### End of Logging ###\n\n');
    next();
}


module.exports = {
    decodeRequestCookie,
    allowXSS,
    appendCSRFToken,
    responseLogging
}