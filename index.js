var express = require('express');
var app = express();
var fs = require('fs');
var marked = require('marked');
var dots = require("dot").process({ path: "./views" });
var removeMd = require('remove-markdown');

var workingDirectory = process.env.workingDirectory || '/Users/robert.stiff/Dropbox/Notes';


function buildListing(originalUrl, files, indexContent) {
    if (originalUrl.endsWith('/')) originalUrl = originalUrl.substr(0, originalUrl.length - 1);
    var title = originalUrl.substr(originalUrl.lastIndexOf('/'));
    var body = null;

    if ( indexContent ) {
        title = removeMd(indexContent.substr(0, indexContent.indexOf('\n')));
        body = marked(indexContent.substr(indexContent.indexOf('\n')));
    }

    return dots.listing({
        originalUrl: originalUrl,
        showUpLink: originalUrl != '',
        files: files,
        title: title,
        showContent: !!body,
        content: body
    });
}

app.use('/_public/', express.static('public'));

app.use(function (req, res, next) {
    var sourceFilePath = workingDirectory + decodeURI(req.originalUrl);
    fs.readFile(sourceFilePath, function (err, data) {
        if ( err ) {
            // if the path is a directory
            if (err.code === 'EISDIR' ) 
            {
                req.isDirectory = true;
                next();
            } 
            else 
            {
                res.status = 500;
                res.send(JSON.stringify(err));
                next();
            }   
        } else {
            var content = data.toString('utf8');
            var title = content.substr(0, content.indexOf('\n'));
            var body = content.substr(content.indexOf('\n'));
            res.send(dots.page({ 
                content: marked(body),
                originalUrl: decodeURI(req.originalUrl),
                title: removeMd(title),
            }));
            next();
        }
    });
});

app.use(function(req, res, next) {
    if ( req.isDirectory )
    {
        var sourceFilePath = workingDirectory + decodeURI(req.originalUrl);
        fs.readdir(sourceFilePath, function (err, files) {
            if (err) {
                res.status = 500;
                res.send(JSON.stringify(err));
                next();
            } else {
                files = files.filter(function(f) { return f[0] != '.'; });
                if ( files.indexOf('index.md') > -1 ) {
                    fs.readFile(sourceFilePath + '/index.md', function (err, data) {
                        res.send(buildListing(decodeURI(req.originalUrl), files, data.toString('utf8')));
                        next();
                    });        
                } else {
                    res.send(buildListing(decodeURI(req.originalUrl), files));
                    next();
                }
            }
        });
    }
});




// app.use(function (req, res, next) {
//     var sourceFilePath = workingDirectory + decodeURI(req.originalUrl);
//     if (sourceFilePath.endsWith('/')) sourceFilePath += 'index.md';
//     fs.readFile(sourceFilePath, function (err, data) {
//         if (err) {
//             if (err.code === 'EISDIR' || (err.code == 'ENOENT' && sourceFilePath.endsWith('/index.md'))) {
//                 if (err.code == 'ENOENT' && sourceFilePath.endsWith('/index.md')) sourceFilePath = sourceFilePath.substr(0, sourceFilePath.length - 'index.md'.length);
//                 fs.readdir(sourceFilePath, function (err2, files) {
//                     if (err2) {
//                         res.status = 500;
//                         res.send(JSON.stringify(err2));
//                         next();
//                     } else {
//                         res.send(buildListing(decodeURI(req.originalUrl), files));
//                         next();
//                     }
//                 });
//             } else {
//                 res.status = 500;
//                 res.send(JSON.stringify(err));
//                 next();
//             }
//         } else {
//             var content = data.toString('utf8');
//             var title = content.substr(0, content.indexOf('\n'));
//             var body = content.substr(content.indexOf('\n'));
//             res.send(dots.page({ 
//                 content: marked(body),
//                 originalUrl: decodeURI(req.originalUrl),
//                 title: removeMd(title),
//             }));
//             next();
//         }
//     });
// });

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Listening on port ' + port);
});

