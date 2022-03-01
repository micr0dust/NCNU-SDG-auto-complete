const http = require('http');
const bot = require('./index');


var server = http.createServer(function(req, res) {
    var ip = clientIp(req);
    let txt = "";
    let url = req.url;
});

server.listen(process.env.PORT || 3000, '0.0.0.0');