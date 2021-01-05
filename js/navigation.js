const createNavigationHTML = (userInfo) => {
    let nav = ''
    nav += '<nav>\n'
    nav += '    <a href="/" style="float: left">Main Page</a>\n'
    
    if (userInfo && userInfo.loggedIn) {
        nav += '    <a href="/logout" style="float: left">Logout</a>\n'

        if (userInfo.role === 'admin') {
            nav += '    <a href="/adminPanel" style="float: left">Admin</a>\n'
        // } else if (userInfo.role === 'vendor') {
        //     nav += '    <a href="/myArticles" style="float: left">My Articles</a>\n'
        } else if (userInfo.role === 'customer') {
            nav += '    <a href="/cart" style="float: left">Cart</a>\n'
        }
    } else {
        nav += '    <a href="/login" style="float: left">Login</a>\n'
    }

    nav += '    <div class="search-bar" style="float: left">\n'
    nav += '        <form action="/search" method="get">\n'
    nav += '            <input type="text" name="key" placeholder="Search...">\n'
    nav += '            <input type="submit">\n'
    nav += '        </form>\n'
    nav += '    </div>\n'
    nav += '</nav>\n'

    return nav
}

module.exports = {
    createNavigationHTML,
}