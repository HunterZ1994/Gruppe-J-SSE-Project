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
   response.sendFile(path.join(__dirname + '/signup.html'));
});

app.post('/register', function (req, res) {
    var user = req.body;
    user.pwHash = tools.createPasswordHash(user.password);
    db_connection.checkIfEmailExists(user).then(result =>{
        if(Object.keys(result).length>1){
            this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signup_error.html');
        }else{
            db_connection.addUser(user).then(result =>{
                 if(result.warningStatus == 0){
                    this.userInfo = { loggedIn: true, userID: user.email, role: 'customer' }
                    res.cookie('userInfo', this.userInfo).redirect('/');
                }else{
                    res.sendStatus(BADQUERY);
                 }
            });
        }
    }).catch(err =>{
        console.log(err);
    })
   
});