const tools = require('./tools');
const htmlParser = require('node-html-parser');

function createArticleForm(userInfo, article) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, 'article/articleForm.html')
            .then(res => {
                const root = htmlParser.parse(res);
                if (article) {
                    for (const key of Object.keys(article)) {
                        if (key.toLowerCase() !== 'seller') {
                            const id = `#${key.charAt(0).toLowerCase() + key.slice(1)}`
                            root.querySelector(id).setAttribute('value', article[key]);
                        }
                    }
                    root.querySelector('#submit').set_content('Speichern');
                }
                resolve(root.toString());
            })
            .catch(err => reject(err));
    });
}

module.exports = {
    createArticleForm
}