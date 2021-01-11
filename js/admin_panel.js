const tools = require('./tools');
const db_connector = require('./database_connection');

function createAdminPanel(userInfo) {
    return new Promise((resolve, reject) => {
        Promise.all([
           tools.readHtmlAndAddNav(userInfo, 'admin_panel.html'),
           db_connector.getAllUsers()
        ]).then(results => {
                const table = tools.buildUserTable(results[1]);
                resolve(results[0].replace('{ adminPanel }', table))
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
}

function deleteUser(userInfo, userId) {
    return new Promise((resolve, reject) => {
        if (!userId) {
            reject({ redirect: '/adminPanel' });
        }
	
        db_connector.getUserById(userId)
        .then(results => {
            if (!(results[0].Userrole === 'admin' || results[0].Userrol === 'vendor')) {
                db_connector.deleteUser(userId)
                    .then(rows => {
                        resolve(true);
                    })
                    .catch(err => {
                        reject({err, redirect: '/adminPanel'});
                    });
            } else {
                reject({ redirect: '/adminPanel' });
            }
        })
        .catch(err => reject({err, redirect: 'adminPanel'}));
    });
}


function blockUser(userInfo, userId) {
    return new Promise((resolve, reject) => {
        if (!userId) {
            reject({ redirect: '/adminPanel' });
        }
        db_connector.getUserById(userId)
        .then(results => {
            if (!(results[0].Userrole === 'admin' || results[0].Userrole === 'vendor')) {
                db_connector.blockUser(userId)
                    .then(rows => {
                        resolve(true);
                    })
                    .catch(err => {
                        reject({err, redirect: '/adminPanel'});
                    });
            } else {
                reject({ redirect: '/adminPanel' });
            }
        })
        .catch(err => {
           reject({err, redirect: '/adminPanel'});
        });
    })
}


module.exports = {
    createAdminPanel,
    deleteUser,
    blockUser
}
