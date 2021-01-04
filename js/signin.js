var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

var db_connection = require('./database_connection');

var app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
   response.sendFile(path.join(__dirname + '/signin.html'));
});

app.post('/login', function (req, res) {
    var dbpwd = tools.createPasswordHash(req.body.password);
    db_connection.getUserByUName(req.body.email).then(result => {
        if(Object.keys(result).length>1){
            var users = result[0];
            if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase()) {
                this.userInfo = { loggedIn: true, userID: users.UserId, role: users.Userrole };
                res.cookie('userInfo', this.userInfo).redirect('/');
            }else{
                this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole };
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
            }
        }else{
            this.userInfo = { loggedIn: false, userID: "", role: "" };
            res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
        }
    });
});