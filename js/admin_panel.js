const tools = require('./tools');
const db_connector = require('./database_connection');
const errorHandler = require('./errorHandler');
const htmlParser = require('node-html-parser');


function createAdminPanel(userInfo) {
    return new Promise((resolve, reject) => {
        Promise.all([
           tools.readHtmlAndAddNav(userinfo, 'admin_panel.html'),
           db_connector.getAllUsers()ear
        ]).then(results => {
                const table = tools.buildUserTable(results[1]);
                resolve(results[0].replace('{ adminPanel }', table))
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
}



module.exports = {
    createAdminPanel,
}
