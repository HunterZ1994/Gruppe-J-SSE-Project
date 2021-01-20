const tools = require('./tools');
const fs = require('fs');
const geoip = require('geoip-lite');
const { lookup } = require('dns');

function writeLog(value='', level= (1 | 2 | 3 | 4), request) {
    let meta = '';
    if (!!request && level > 2) {
        const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        const geoPos = geoip.lookup(ip);
        const browser = request.headers['user-agent']; 
        const realBrowser = request.headers['sec-ch-ua']
        meta = `IP: ${ip}\n GEO: ${JSON.stringify(geoPos)}\n BROWSER: ${browser}\n VERSION: ${realBrowser}\n`;
    }
    const message = `${level};${value};${new Date().toISOString()};${meta};\n`;
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
        res += '    <th> META </th>'
        res += '</tr>';
        res += '</thead>'
        res += '<tbody>'
        for (const line of lines) {
            if (line !== '') {
                const sl = line.split(';');
                let logClass = `log-level-${sl[0]}`;
                res += `    <tr> <td class="${logClass}"> ${sl[0]} </td> <td class="log-data"> ${sl[1]} </td> <td> ${sl[2]} </td>`;
                if (!!sl[3] && sl[3] !== '') {
                    res += `<td> ${sl[3]} </td>`;
                }
                res += '</tr>\n';
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