const tools = require('./tools');
const htmlParser = require('node-html-parser');

function createErrorResponse(userInfo, statusCode, message, redirectHtml) {
    return new Promise((resolve, reject) => {
        const htmlPath = redirectHtml ? redirectHtml : '/error.html';
        tools.readHtmlAndAddNav(userInfo, htmlPath)
        .them(html => {
            const root = htmlParser.parse(html);
            root.querySelector('#head').appendChild(`<script> window.alert(Error: ${statusCode} => ${message}) </script>`);
            resolve({code: statusCode,  html: root.toString});
        })
        .catch(err => reject(err));
    });

}

module.exports = {
    createErrorResponse
}