function buildArticlesTable(articles) {
    let artTable = ''

    if (articles.length > 0) {
        artTable += '<table class="item-table-component">\n'
        artTable += '   <tr>\n'
        artTable += '       <th>Name</th>\n'
        artTable += '       <th>Description</th>\n'
        artTable += '       <th>Price</th>\n'
        artTable += '       <th>Image</th>\n'
        artTable += '   </tr>\n'
        for(let article of articles) {
            artTable += '   <tr>\n'
            artTable += '       <td><a href="/product/' + article.ArticleId + '">' + article.ArticleName + '</a></td>\n'
            artTable += '       <td>' + article.Descpt + '</td>\n'
            artTable += '       <td>' + article.Amount + '$</td>\n'
            artTable += '       <td><img src="' + article.ImagePath
                + '" style="max-height: 150px; max-width: 150px;"></td>\n'
            artTable += '   </tr>\n'
        }
        artTable += '</table>'
    }
    else {
        artTable = 'No products matching search criteria'
    }

    return artTable
}

module.exports = {
    buildArticlesTable,
}