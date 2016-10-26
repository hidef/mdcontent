var recursive = require('recursive-readdir');
var marked = require('marked');
var removeMd = require('remove-markdown');
var os = require('os');
var fs = require('fs-extra');



var viewDir = (process.env.viewDir || '.') + "/views";
var dots = require("dot").process({ path: viewDir });
var workingDirectory = process.env.workingDirectory || 'test-content';

function includeFoldersAndMdFiles(fileName, stats)
{
    return !fileName.endsWith('.md') && !stats.isDirectory();
}

recursive(workingDirectory, [includeFoldersAndMdFiles], function (err, files) {
    if (err) {
        console.log(err);
        process.exit(-1);
    } else {
        files = files.filter(function(f) { return f[0] != '.'; });
        files.forEach(f => {
            fs.readFile(f, function (err, data) {
                if ( err ) {
                    console.log(err);
                    process.exit(-1);
                } else {
                    renderFile(f.replace(workingDirectory, ''), data);
                }
            });
        });
    }
});

function renderFile(fileName, data)
{
    var content = data.toString('utf8');
    var title = content.substr(0, content.indexOf('\n'));
    var body = content.substr(content.indexOf('\n'));
    var output = dots.page({ 
        content: marked(body),
        title: removeMd(title),
    });

    var outputFileName = 'dist/' + fileName.substr(0, fileName.lastIndexOf(".md")) + '.html';
    ensureFilePathExists('.', outputFileName);
    fs.writeFileSync(outputFileName, output);
}

function ensureFilePathExists(workingDir, fileName)
{
    var firstSlash = fileName.indexOf('/');
    if ( firstSlash == -1 ) return;

    var folder = fileName.substr(0, firstSlash);
    var rest = fileName.substr(firstSlash + 1, fileName.length - firstSlash - 1);
    if ( !fs.existsSync(workingDir + '/' + folder) ) {
        fs.mkdirSync(workingDir + '/' + folder);
    }

    ensureFilePathExists(workingDir + '/' + folder, rest);
}