var express = require ('express');
var app = express();
var fs = require('fs');
var marked = require('marked');

var workingDirectory = process.env.workingDirectory;

app.use(function (req, res, next) {
    var sourceFilePath = workingDirectory + req.originalUrl;
    if ( sourceFilePath.endsWith('/') ) sourceFilePath += 'index.md';
    fs.readFile(sourceFilePath, function(err, data) {
        if ( err ) {
            res.status = 500;
            res.send(JSON.stringify(err));
        } else { 
            res.send(marked(data.toString('utf8')));
        }
        next();
    });
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log('Listening on port ' + port);
});