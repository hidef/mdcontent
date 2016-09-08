var express = require ('express');
var app = express();
var fs = require('fs');
var marked = require('marked');

var workingDirectory = process.env.workingDirectory || '/Users/robert.stiff/Dropbox/Notes';

function buildLink(path, filename) {
    if ( path.endsWith ('/') ) path = path.substr(0, path.length - 1);
    return '<a href="' + path + '/' + filename+ '">' + filename + '</a>';
}

app.use(function (req, res, next) {
    var sourceFilePath = workingDirectory + req.originalUrl;
    if ( sourceFilePath.endsWith('/') ) sourceFilePath += 'index.md';
    fs.readFile(sourceFilePath, function(err, data) {
        if ( err ) {
            if ( err.code === 'EISDIR' || (err.code == 'ENOENT' && sourceFilePath.endsWith('/index.md'))) {
                if (err.code == 'ENOENT' && sourceFilePath.endsWith('/index.md')) sourceFilePath = sourceFilePath.substr(0, sourceFilePath.length - 'index.md'.length);
                fs.readdir(sourceFilePath, function(err2, files) {
                    if (err2) {
                        res.status = 500;
                        res.send(JSON.stringify(err2));
                        next();
                    } else {
                        res.send('<h2><a href="..">Back</a></h2></br>' + files.map(buildLink.bind(null, req.originalUrl)).join('<br />'));
                        next();
                    }
                });
            } else {
                res.status = 500;
                res.send(JSON.stringify(err));
                next();
            }
        } else { 
            res.send(marked(data.toString('utf8')));
            next();
        }
    });
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log('Listening on port ' + port);
});

