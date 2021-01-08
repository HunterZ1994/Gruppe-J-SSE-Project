const tools = require('./tools');
const index = require('./index');

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
            resolve({code: statusCode,  html: html.replace('{ script }', `<script> window.alert(Error: ${statusCode} => ${message}) </script>`)});
        })
        .catch(err => reject(err));
    });

}

module.exports = {
    createErrorResponse
}