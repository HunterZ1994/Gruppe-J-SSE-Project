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
            errorHanlder.createErrorResponse(userInfo, 400, "Bad Request, No User Id")
                .then(err => {
                    reject(err);
                });
        }
	
	Promise.all ([
	    db_connector.geUserById()

	]).then(results => {
	    if (!(results[0].Userrole === 'admin' || results[0].Userrol === 'vendor')) {

	        db_conector.deleteUser(userId)
            	.then(rows => {

                    admin_panel.createAdminPanel(userInfo)
            	})
            	.catch(err => {
                    errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                    .then(html => {
                        console.log(err);
                        reject(html);
                    });
                });
	    }
    })
    
    function blockUser(userInfo, userId) {
        return new Promise((resolve, reject) => {
            if (!userId) {
                errorHanlder.createErrorResponse(userInfo, 400, "Bad Request, No User Id")
                .then(err => {
                    reject(err);
                });
            }

            Promise.all ([
                db_connector.geUserById()
        
            ]).then(results => {
                if (!(results[0].Userrole === 'admin' || results[0].Userrol === 'vendor')) {
        
                    db_conector.blockUser(userId)
                        .then(rows => {
        
                            admin_panel.createAdminPanel(userInfo)
                        })
                        .catch(err => {
                            errorHandler.createErrorResponse(err, userInfo, 500, "Internal Server Error")
                            .then(html => {
                                console.log(err);
                                reject(html);
                            });
                        });
                }
            })
        })
    }

            
    });
}

module.exports = {
    createAdminPanel,
    deleteUser,
    blockUser
}
