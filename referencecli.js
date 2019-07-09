let updatedReference = require('express').Router();
let config = require('./config.json');
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
let xml2js = require('xml2js');
let js2xmlparser = require("js2xmlparser");
let redBus = require('./token.js');
let http = require('http');
let httprequest = require('request');
let fun = require('./functions.js');

updatedReference.post('/', function (request, response, next) {
    if (request.body.token == 'jsontoxml') {
        try {
            var data = (request.body.content);
            var parsedJson = JSON.parse(data);
            if (parsedJson.citation.type !== undefined) {
                if (parsedJson.citation.type[0]['#'] !== '')
                    parsedJson.citation.type[0]['#'] = (parsedJson.citation.type[0]['#'].replace(/\./g, ''));
            }
            if (parsedJson.citation.bibarticle !== undefined) {
                console.log("Article");
                if (parsedJson.citation.bibarticle[0].articletitle[0]['@'].language === '') {
                    parsedJson.citation.bibarticle[0].articletitle[0]['@'].language = "En";
                }
            }
            if (parsedJson.citation.bibbook !== undefined) {
                console.log("Book");
                if (parsedJson.citation.bibbook[0].booktitle[0]['@'].language === '') {
                    parsedJson.citation.bibbook[0].booktitle[0]['@'].language = "En";
                }
            }
            if (parsedJson.citation.bibchapter !== undefined) {
                console.log("Chapter");
                if (parsedJson.citation.bibchapter[0].chaptertitle[0]['@'].language === '') {
                    parsedJson.citation.bibchapter[0].chaptertitle[0]['@'].language = "En";
                }
            }
            var keys = Object.keys(parsedJson['citation']);
            var bibtype = '';
            ['bibarticle', 'bibbook', 'bibchapter'].forEach(function (e) {
                if (keys.indexOf(e) > -1) {
                    bibtype = e;
                }
            });
            var item = [];
            if (parsedJson["citation"][bibtype]) {
                item = fun.clistructure(parsedJson, bibtype);
            }
            var options =
            {
                url: 'http://' + config.cliserver + ':' + config.cliserverport, host: config.cliserver, port: config.cliserverport, path: config.cliPath, method: 'POST',
                qs: { responseformat: 'json', style: 'springer-basic-author-date' }, headers: { 'content-type': 'application/json', 'accept': '*/*' }, body: { "items": item }, json: true
            };
            httprequest(options, function (error, clires, body) {
                if (error) throw new Error(error);
                if (parsedJson.citation.type && (request.body.type == 0 || request.body.type == '')) {
                    delete parsedJson.citation.type;
                }
                parsedJson.citation.bibunstructured = body.bibliographyentry[0].bib;
                var xml = js2xmlparser.parse('sample', parsedJson, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });
                xml = fun.replacexml(xml, request.body.type);
                response.status(200).send(xml);
            });

        }
        catch (error) {
            console.error("problem with request: " + error);
            response.json({ status: 404, msg: "error" });
        }
        finally {
            if (response.statusCode !== 200)
                response.status(300).send(JSON.stringify("Unknown Error"));
        }
    }
});

module.exports = updatedReference;
