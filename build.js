var recursive = require('recursive-readdir');
var marked = require('marked');
var removeMd = require('remove-markdown');
var os = require('os');
var fs = require('fs-extra');



var viewDir = (process.env.viewDir || '.') + "/views";
var dots = require("dot").process({ path: viewDir });
var workingDirectory = process.env.workingDirectory || 'test-content';


var siteConfig = JSON.parse(fs.readFileSync(workingDirectory + '/site.json'));

if (fs.existsSync('dist'))
{
    fs.removeSync('dist');
}

function trimLeft(input, trimValue) {
  var i = 0;
  while ( input.substr(i, trimValue.length) == trimValue ) {
    i++;
  }
  return input.substr(i + trimValue.length - 1);
}


recursive(workingDirectory, function (err, files) {
    console.log(workingDirectory);
    if (err) {
        console.log(err);
        process.exit(-1);
    } else {
        files = files.filter(function(f) { return f.endsWith('.md') && !f.startsWith('node_modules'); });
        files.forEach(f => {
            fs.readFile(f, function (err, data) {
                if ( err ) {
                    console.log(err);
                    process.exit(-1);
                } else {
                    console.log(f);
                    console.log(trimLeft(f, workingDirectory + '/'));
                    renderFile(trimLeft(f, workingDirectory), data);
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
        siteConfig: siteConfig,
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