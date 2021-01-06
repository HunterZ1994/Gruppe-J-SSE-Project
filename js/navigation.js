const createNavigationHTML = (userInfo) => {
    // console.log(userInfo);
    let nav = ''
    nav += '<div class="topnav">\n'
    nav += '    <a href="/">Main Page</a>\n'
    
    if (userInfo && userInfo.loggedIn) {
        nav += '    <a href="/logout">Logout</a>\n'

        if (userInfo.role === 'admin') {
            nav += '    <a href="/adminPanel">Admin</a>\n'
        // } else if (userInfo.role === 'vendor') {
        //     nav += '    <a href="/myArticles" style="float: left">My Articles</a>\n'
        } else if (userInfo.role === 'customer') {
            nav += '    <a href="/cart">Cart</a>\n'
        }
    } else {
        nav += '    <a href="/login">Login</a>\n'
    }

    nav += '    <div class="search-bar">\n'
    nav += '        <form action="/search" method="get">\n'
    nav += '            <input type="text" name="key" placeholder="Search...">\n'
    nav += '            <input type="submit">\n'
    nav += '        </form>\n'
    nav += '    </div>\n'
    nav += '</div>\n'

    return nav
}

module.exports = {
    createNavigationHTML,
}