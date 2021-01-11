const express = require('express');
const path = require('path');
const tools = require("./tools");

function getSignin(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', ' '));
        }).catch(err => reject(err));
    });
}

function SigninErrorWrongPassword(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', '<script>window.alert("Username or pasword wrong! Please try again.);</script> '));
        }).catch(err => reject(err));
    });
}


function SigninErrorWrongEmail(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, "/signin.html").then(result => {
            resolve(result.replace('{ script }', '<script>window.alert("User not found! Please try again.);</script> '));
        }).catch(err => reject(err));
    });
}

function checkSignin(email, password){
    const dbpwd = tools.createPasswordHash(password);
    db_connector.getUserByUName(email).then(result => {
        if (Object.keys(result).length > 1) {
            const users = result[0];
            if (dbpwd.toUpperCase() === users.PwdHash.toUpperCase() && !users.Blocked) {
                path = '/';
            } else{
                this.userInfo = { loggedIn: false, userId: users.UserId, role: users.Userrole }
                userInfo = { loggedIn: false, userId: users.UserId, role: users.Userrole }
                path = '/signin';
            }
        } else {
            path = '/signin';
        }
        const encoded = tools.encodeCookie('userInfo', userInfo);
        req.session[encoded.name] = encoded.cookie;
        req.session.save();
        res.cookie(encoded.name, encoded.cookie);
        if (path === '/') {
            res.redirect(path);
        } else {
            tools.injectScript(tools.checkSession(req.session), "/signin.html", 
                "<script>window.alert('Username or password wrong! Please try agaim. );</script>"
            ).then(result =>{
                res.send(result);
            })
        }
    });
            
}

module.exports = {
    getSignin,
    SigninErrorWrongPassword,
    SigninErrorWrongEmail,
    checkSignin,
}