const tools = require('./tools');
const fs = require('fs');

function writeLog(value='', level= (1 | 2 | 3 | 4)) {
    const message = `${level};${value};${new Date().toISOString()}\n`;
    fs.appendFileSync(__dirname + '/../logs/logs.txt', message, function(err) {
        if (err) {
            console.log(err);
        }
    })
}

function logFileToHtml() {
    try {
        const logs = fs.readFileSync(__dirname + '/../logs/logs.txt', 'utf-8');
        const lines = logs.split(/\r?\n/);
        let res = '<table class="item-table-component">';
        res += '<thead>'
        res += '<tr>';
        res += '    <th> LEVEL </th>';
        res += '    <th> LOG </th>'
        res += '    <th> DATE </th>'
        res += '</tr>';
        res += '</thead>'
        res += '<tbody>'
        for (const line of lines) {
            if (line !== '') {
                const sl = line.split(';');
                let logClass = `log-level-${sl[0]}`;
                res += `    <tr> <td class="${logClass}"> ${sl[0]} </td> <td class="log-data"> ${sl[1]} </td> <td> ${sl[2]} </td> </tr>\n`;
            }
        }

        return res += '</tbody>\n</table>';
    } catch (err) {
        console.log(err);
        return '<h1> Error while reading Log... </h1>';
    }
}

function createLogHtml(userInfo) {
    return new Promise((resolve, reject) => {
        tools.readHtmlAndAddNav(userInfo, '/logging.html')
        .then(res => {
            resolve(res.replace('{ logs }', logFileToHtml()));
        })
        .catch(err => {
            console.log(err);
            reject('Captured a Flag... with an Error... That was unexpected');
        });
    });

}

function getCurrentLogLength() {
    const logs = fs.readFileSync(__dirname + '/../logs/logs.txt', 'utf-8');
    const lines = logs.split(/\r?\n/);
    return lines.length;
}

module.exports = {
    writeLog,
    createLogHtml,
    getCurrentLogLength
};