const tools = require('./tools');
const index = require('./index');
const htmlParser = require('node-html-parser');

function createErrorResponse(error, userInfo, statusCode, message, redirectHtmlFileName,) {
    return new Promise((resolve, reject) => {
        console.log('##### Error: \n' + error + ' \n####\n');
        const htmlPath = redirectHtmlFileName ? redirectHtmlFileName : 'error.html';
        let promise = null;
        switch (htmlPath) {
            case 'index.html':
                promise = index.createIndex(userInfo);
                break; 
            default: 
                promise = tools.readHtmlAndAddNav(userInfo, htmlPath);
        }
        promise.then(html => {
            const root = htmlParser.parse(html);
            root.querySelector('#head').appendChild(`<script> window.alert(Error: ${statusCode} => ${message}) </script>`);
            resolve({code: statusCode,  html: root.toString()});
        })
        .catch(err => reject(err));
    });

}

module.exports = {
    createErrorResponse
}