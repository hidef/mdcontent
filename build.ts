"use strict";
/// <reference path="typings/index.d.ts" />
var recursive = require('recursive-readdir');
var marked = require('marked');
var removeMd = require('remove-markdown');
var os = require('os');
var fs = require('fs-extra');
var viewDir = (process.env.viewDir || '.') + "/views";

// environment
var dots = require("dot").process({ path: viewDir });
var workingDirectory = process.env.workingDirectory || 'test-content';
var siteConfig = JSON.parse(fs.readFileSync(workingDirectory + '/site.json'));


main();

async function main() {

    // application
    if (fs.existsSync('dist'))
    {
        fs.removeSync('dist');
    }

    var files: string[] = await recursiveAsync(workingDirectory);
    files = files
        .filter(function(f) { return f.endsWith('.md') && !f.startsWith('node_modules'); })
    
    files.map(loadPage)
        .forEach(async (pp: Promise<Page>) => {
            var p = await pp;
            
            var fileName = trimLeft(p.path, workingDirectory);
            
            var chunks = splitContent(p.content);

            var parsedMetadata = parseMetadata(chunks.metaDataChunk);

            var pageModel = {
                siteConfig: siteConfig,
                content: marked(chunks.contentChunk),
                metadata: parsedMetadata || {},
                outputPath: 'dist/' + fileName.substr(0, fileName.lastIndexOf(".md")) + '.html'
            };
            renderFile(pageModel);
        });
}

async function loadPage(fileName: string): Promise<Page> {
    var data = await readFileAsync(fileName);
    return {
        path: fileName,
        content: data
    } as Page;
}

// Types

class Page 
{
    path: string;
    title: string;
    tags: string[];
    author: string;
    date: string;
    content: string;
}

// Functions
async function readFileAsync(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if ( err ) reject(err);
            resolve(data.toString('utf8'));
        });
    });
}
async function recursiveAsync(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        recursive(path, (err, files) => {
            if ( err ) reject(err);
            resolve(files);
        });
    });
}

function trimLeft(input, trimValue) {
  var i = 0;
  while ( input.substr(i, trimValue.length) == trimValue ) {
    i++;
  }
  return input.substr(i + trimValue.length - 1);
}

function parseMetadata(metadatastring) {
    var lines = metadatastring.split('\n');
    var metadata = {};
    for ( var line of lines ) {
        if ( line.startsWith('---') ) continue;
        if ( line.length == '0' ) continue;
        var parts = line.split(':');
        metadata[parts[0]] = line.substr(parts[0].length + 1).trim();
    }
    return metadata;
}

function splitContent(data) {
    var lines = data.split('\n');
    var isMetaData = false;
    var metaDataChunk = '';
    var contentChunk = '';
    for ( var line of lines ) {
        if ( !isMetaData && line.startsWith('---') ) {
            isMetaData = true;
        } else if ( isMetaData ) {
            contentChunk += line + '\n';
        } else { 
            metaDataChunk += line + '\n';
        }
    }
    if ( contentChunk == '' )  {
        contentChunk = metaDataChunk;
        metaDataChunk = '';
    }
    return { metaDataChunk, contentChunk };
}

function renderFile(pageModel)
{

    var output = dots.page(pageModel);

    ensureFilePathExists('.', pageModel.outputPath);
    fs.writeFileSync(pageModel.outputPath, output);
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