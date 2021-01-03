const tools = require('./tools');
const htmlParser = require('node-html-parser');

function createErrorResponse(userInfo, statusCode, message) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, '/error.html')
        .them(html => {
            const root = htmlParser.parse(html);
            root.querySelector('#errorMessage').set_content(`Error: ${statusCode} => ${message}`);
        })
        .catch(err => reject(err));
    });

}

module.exports = {
    createErrorResponse
}