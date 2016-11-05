/// <reference path="typings/index.d.ts" />

var express = require('express');
var app = express();

var public = process.env.public || 'public';

app.use('/_public/', express.static(public));

app.use('/', (req: any, res: any, next: Function) => {
    if ( req.url.endsWith('/') ) req.url = req.url + 'index';
    next();
});

app.use('/', (req: any, res: any, next: Function) => {
    var parts = req.url.split('/');
    if ( parts[parts.length - 1].indexOf('.') == -1 ) {
        req.url = req.url + '.html';
    }
    next();
});

app.use('/', express.static('dist'));

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Listening on port ' + port);
});

