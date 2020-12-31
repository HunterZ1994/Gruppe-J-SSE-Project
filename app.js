const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const index = require('./js/index');
const cart = require('./js/cart');
const search_results = require('./js/search_results');
const db_conector = require("./js/database_connection");
const cookieParser = require('cookie-parser');
const { userInfo } = require('os');
const tools = require("./js/tools");
const { BADQUERY } = require('dns');

const htmlPath = path.join(__dirname) + '/html';
const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

// TODO: replace hard-coded user info with cookie
// const userInfo = { loggedIn: false, role: 'customer' };

function createResponseHTML(contentHTML) {
    // read header and Navigation
    // append content 
    // append possible footer
    // return string or file
}

app.use(express.static('public'));
app.use('/images', express.static(__dirname + '/assets/images'));
app.use('/css', express.static(__dirname + '/css'));

app.get('/', function (req, res) {
    // TODO: replace hard-coded userInfo with info from cookie
    index.createIndex(req.cookies.userInfo).then(result => {
        res.send(result);
    })
});

app.get('/login', function (req, res) {
    res.sendFile(htmlPath + '/signIn.html');
});

app.post('/login', function (req, res) {
    const dbpwd = tools.createPasswordHash(req.body.password);
    db_conector.getUserByUName(req.body.email).then(result => {
        if(Object.keys(result).length>1){
            const users = result[0];
            if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase()) {
                this.userInfo = { loggedIn: true, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).redirect('/')
            }else{
                this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
            }
        }else{
            this.userInfo = { loggedIn: false, userID: "", role: "" }
            res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signin_error.html');
        }
    });
});

app.get('/logout', function (req, res) {
    // TODO: logout
    let userInfo = req.cookies.userInfo;
    userInfo.loggedIn = false;
    res.cookie('userInfo', userInfo).redirect('/');
});

app.get('/register', function (req, res) {
    res.sendFile(htmlPath + '/signup.html');
});

app.post('/register', function (req, res) {
    var user = req.body;
    user.pwHash = tools.createPasswordHash(user.password);
    db_conector.checkIfEmailExists(user).then(result =>{
        if(Object.keys(result).length>1){
            this.userInfo = { loggedIn: false, userID: users.UserId, role: users.Userrole }
                res.cookie('userInfo', this.userInfo).sendFile(htmlPath + '/signup_error.html');
        }else{
             db_conector.addUser(user).then(result =>{
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

app.get('/search', function (req, res) {
    let key = encodeURI(req.query.key)
    // TODO: replace hard-coded userInfo with info from cookie
    search_results.createSearchResults(req.cookies.userInfo, key).then(result => {
        res.send(result);
    })
});

// #region admin

app.get('/adminPanel', function (req, res) {
    // TODO: check for role
    // TODO: return admin page
    throw Error('Method adminPanel not implemented')
});

// #endregion

// #region vendor

function createVendorIndexPage() {
    // read all articles of vendor from db
    // place in html 
    // add into index.html
    // return hmtl 
}

app.get('/article/add', function (req, res) {
    // check user info
    // return only if vendor

    res.sendFile(htmlPath + '/article/articleForm.html');
});

app.post('/article/add', function (req, res) {
    const form = new formidable.IncomingForm();
    const userid = 1;
    form.parse(req, function (err, fields, files) {
        const article = fields;

        db_conector.addArticle({ ...fields, imagePath: path.join(__dirname, 'assets') + `/images/${userid}/${article.articleName}/${files.image.name}` }, 1)
            .then(res => {
                // file upload and saving
                const oldpath = files.image.path;
                const newpath = path.join(__dirname, 'assets') + `/images/${userid}/${article.articleName}/${files.image.name}`;
                const rawData = fs.readFileSync(oldpath);
                if (!fs.existsSync(path.join(__dirname, 'assets') + `/images/${userid}/${article.articleName}`)) {
                    fs.mkdirSync(path.join(__dirname, 'assets') + `/images/${userid}/${article.articleName}`);
                }
                fs.writeFile(newpath, rawData, function (err) {
                    if (!err) {
                        res.send('sucess');
                    } else {
                        console.log(err);
                    }
                });
            })
            .catch(err => { });
    });

    // load article object
    // check validity
    // save to db
    // fail -> return addArticle Page with filled form and error message
    // return index page with articles of user and success message
});

app.delete('/article/delete', function (req, res) {
    // read id from query
    // delete article
    // fail return index with articles and error message
    // success return index with articles and success message
});


app.get('/article/edit', function (req, res) {
    // return article form filed
});

app.post('/article/edit', function (req, res) {
    // get json from body
    // check validity 
    // update in db
    // fail --> return filled editArticle with error message
    // success --> return index with sucess
});

// cart

app.get('/cart', (req, res) => {
    // TODO: replace hard-coded userInfo with info from cookie
    cart.createCart(req.cookies.userInfo).then(result => {
        res.send(result);
    })
})

app.delete('/cart', (req, res) => {
    console.log(req.query.id);
    res.send('Youve deleted an item from your cart')
})

//#endregion

const port = process.env.PORT || 8080;

const server = app.listen(port, function () {
    console.log("Server listening on port %s...", port);
});