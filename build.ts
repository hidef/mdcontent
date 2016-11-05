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

    (await recursiveAsync(workingDirectory))
        .filter(function(f) { return f.endsWith('.md') && !f.startsWith('node_modules'); })
        .map(loadPage)
        .forEach(async (pp: Promise<Page>) => {
            var p = await pp;
            renderFile(p);
        });
}

async function loadPage(fileName: string): Promise<Page> {
    var data = await readFileAsync(fileName);
        
    var outputFileName = trimLeft(fileName, workingDirectory);
    
    var chunks = splitContent(data);

    var parsedMetadata: any = parseMetadata(chunks.metaDataChunk) || {};

    return {
        sourcePath: fileName,
        outputPath: 'dist/' + outputFileName.substr(0, outputFileName.lastIndexOf(".md")) + '.html',

        content: marked(chunks.contentChunk),

        author: parsedMetadata.author,
        date: parsedMetadata.date,
        tags: parsedMetadata.tags,
        title: parsedMetadata.title
    } as Page;
}

// Types

class Page 
{
    sourcePath: string;
    outputPath: string;
    title: string;
    tags: string[];
    author: string;
    date: string;
    content: string;
}

// Functions
async function readFileAsync(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, (err: any, data: Buffer) => {
            if ( err ) reject(err);
            resolve(data.toString('utf8'));
        });
    });
}
async function recursiveAsync(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        recursive(path, (err: any, files: string[]) => {
            if ( err ) reject(err);
            resolve(files);
        });
    });
}

function trimLeft(input: string, trimValue: string) {
  var i = 0;
  while ( input.substr(i, trimValue.length) == trimValue ) {
    i++;
  }
  return input.substr(i + trimValue.length - 1);
}

function parseMetadata(metadatastring: string) {
    var lines = metadatastring.split('\n');
    var metadata: any = {};
    for ( var line of lines ) {
        if ( line.startsWith('---') ) continue;
        if ( line.length == 0 ) continue;
        var parts = line.split(':');
        metadata[parts[0]] = line.substr(parts[0].length + 1).trim();
    }
    return metadata;
}

function splitContent(data: string) {
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

function renderFile(pageModel: Page)
{
    console.log('==========================================================================================================================================');
    console.log();
    
    console.log('rendering', pageModel.outputPath);
    try {
        var output = dots.page({
            siteModel: siteConfig,
            pageModel
        });
    } catch (ex) {
        console.log(ex);
    }

    console.log('ensureFilePathExists', pageModel.outputPath);

    ensureFilePathExists('.', pageModel.outputPath);
    console.log('writeFileSync', pageModel.outputPath);
    fs.writeFileSync(pageModel.outputPath, output);
    console.log('end');
    console.log();
}

function ensureFilePathExists(workingDir: string, fileName: string)
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