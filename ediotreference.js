let reference1 = require('express').Router();
let js2xmlparser = require("js2xmlparser");
let xml2js = require('xml2js');
let redBus = require('./token.js');
let http = require('http');

const { parseString } = require('xml2js')
const xmlParse = require("xml-parse");
const builder = require('xmlbuilder');
const httprequest = require('request');
var base64data = '', decodedtxt = '', responseString = '';

function ReplaceTag(val) {
    //val = val.replace(/\&lt;(\/?strong|\/?em)\&gt;/ig,'<$1>');
    val = val.replace(/boldopen/ig, '<strong>');
    val = val.replace(/boldopen/ig, '<b>');
    val = val.replace(/emopen/ig, '<em>');
    val = val.replace(/emopen/ig, '<i>');
    val = val.replace(/boldclose/ig, '</strong>');
    val = val.replace(/boldclose/ig, '</b>');
    val = val.replace(/emclose/ig, '</em>');
    val = val.replace(/emclose/ig, '</i>');
    return val.trim();
}
function nameToLowerCase(name) {
    return name.toLowerCase();
}
function escapeHtml(value) {
    return escape(value.trim());
}
function getXmltag(xmlDoc, builder, tag, type) {
    if (type === 1) {
        var testSpace = '';
    }
    if (type === 2) {
        var testSpace = '';
    }
    if (type === 3) //Etal
    {
        var testSpace = 'No';
    }
    return (xmlDoc.document.getElementsByTagName(tag)[0] == undefined ||
        xmlDoc.document.getElementsByTagName(tag)[0].innerXML === '' ||
        xmlDoc.document.getElementsByTagName(tag)[0].innerXML === ' ') ? builder.create(tag).text(testSpace) :
        builder.create(tag).text((xmlDoc.document.getElementsByTagName(tag)[0].innerXML).trim());
}
function removeEmptyElement(parsedJson, bibtype, tag) {
    if (tag == 'etal') {
        if (parsedJson["citation"][bibtype][0][tag] !== undefined) {
            if (parsedJson["citation"][bibtype][0][tag][0]['#'] == 'No') {
                parsedJson["citation"][bibtype][0][tag][0]['#'] = '';
            }
        }
    }
    if (parsedJson["citation"][bibtype][0][tag] !== undefined) {
        var condition = parsedJson["citation"][bibtype][0][tag][0]['#']
        if (condition == undefined || condition == ' ' || condition == '') {
            delete parsedJson["citation"][bibtype][0][tag];
        }
    }
    return parsedJson;
}
function getAllotherdetails(xmlDoc, listofitems, builder) {
    var listElements = '';
    listofitems.forEach(function (e) { listElements += getXmltag(xmlDoc, builder, e, 1); })
    return listElements;
}
function getAuthordetail(xmlDoc, bibtype, builder, authorType) {
    var xml = '';
    if (xmlDoc.document.getElementsByTagName(bibtype).length == 0 ||
        xmlDoc.document.getElementsByTagName(bibtype)[0].childNodes.length === 0) {
        return "<" + authorType + "><initials></initials><familyname></familyname></" + authorType + ">";
    }
    for (var i = 0; i < xmlDoc.document.getElementsByTagName(bibtype).length; i++) {
        xml += "<" + authorType + ">";
        xml += getAllotherdetails(xmlDoc, ['initials', 'familyname'], builder)
        xml += "</" + authorType + ">";
    }
    return xml;
}
function getTitle(xmlDoc, bibtype, builder) {
    var titleContent = '';
    if (xmlDoc.document.getElementsByTagName(bibtype)[0] == undefined ||
        xmlDoc.document.getElementsByTagName(bibtype)[0].innerXML === '' ||
        xmlDoc.document.getElementsByTagName(bibtype)[0].innerXML === ' ') {
        titleContent += builder.create(bibtype).ele(bibtype, { "language": "En" }).text("");
    }
    else {
        var languageAtrr = (xmlDoc.document.getElementsByTagName(bibtype)[0].attributes.language !== undefined) ? (xmlDoc.document.getElementsByTagName(bibtype)[0].attributes.language).trim() : "En";
        titleContent += "<" + bibtype + " language=\"" + languageAtrr + "\">" + xmlDoc.document.getElementsByTagName(bibtype)[0].innerXML + "</" + bibtype + ">";
    }
    return titleContent;
}
function getEditor(xmlDoc, bibtype, builder) {
    var xml = '';
    if (xmlDoc.document.getElementsByTagName(bibtype).length == 0) {
        return "<bibeditorname><initials></initials><familyname></familyname></bibeditorname>";
    }
    for (var i = 0; i < xmlDoc.document.getElementsByTagName(bibtype).length; i++) {
        xml += "<bibeditorname>";
        xml += getAllotherdetails(xmlDoc, ['initials', 'familyname'], builder)
        xml += "</bibeditorname>";
    }
    return xml;
}
function replaceContent(xml) {
    xml = xml.replace(/<?xml version=\"1.0\"?>/g, '');
    xml = xml.replace(/<?xml version="1.0"?>/g, '');
    xml = xml.replace(/&lt;/g, '<');
    xml = xml.replace(/&gt;/g, '>');
    xml = xml.replace(/\n/g, '');
    xml = xml.replace(/\s{2,}/g, '');
    xml = xml.replace(/�/g, '');
    return xml;
}

reference1.use(function timeLog(request, res, next) {
    console.log("reference1 " + request.method + " Request Received at " + Date.now() + "\n");
    next()
});
reference1.get('/', function (request, response, next) {
    response.status(400).send(JSON.stringify({ 'error': 'get process cannot be done. please use post' }));
});
reference1.post('/', function (request, response, next) {
    if (request.body.token == undefined || request.body.token == '') {
        response.status(400).send(JSON.stringify({ 'ErrorCode': 'Type argument was not supplied' }));
    }
    else if (request.body.content == undefined || request.body.content == '') {
        response.status(400).send(JSON.stringify({ 'ErrorCode': 'content argument was not supplied' }));
    }
    else {
        if (request.body.token == 'xmltojson') {
            try {
                request.body.content = request.body.content.replace(/\n/g, '');
                request.body.content = request.body.content.replace(/\t/g, '');
                request.body.content = request.body.content.replace(/\s{2,}/g, '');
                request.body.content = request.body.content.toString().trim().replace(/(\r\n|\n|\r)/g, "");
                request.body.content = request.body.content.replace(/noarticletitle/g, 'articletitle');
                request.body.content = request.body.content.replace(/nogivenname/g, 'givenname');
                request.body.content = request.body.content.replace(/div class="Citation" ID/ig, 'citation id');
                request.body.content = request.body.content.replace(/Citation ID/ig, 'citation id');
                request.body.content = request.body.content.replace(/div class="BibStructured"/ig, 'bibstructured');
                request.body.content = request.body.content.replace(/<\/bibarticle><\/div>/ig, '</bibarticle></bibstructured>');
                request.body.content = request.body.content.replace(/<\/bibbook><\/div>/ig, '</bibbook></bibstructured>');
                request.body.content = request.body.content.replace(/<\/bibchapter><\/div>/ig, '</bibchapter></bibstructured>');

                //request.body.content = request.body.content.replace(/<strong>/ig,'boldopen');
                // request.body.content = request.body.content.replace(/<strong>/ig,'boldopen');
                // request.body.content = request.body.content.replace(/<b>/ig,'boldopen');
                // request.body.content = request.body.content.replace(/<em>/ig,'emopen');
                // request.body.content = request.body.content.replace(/<i>/ig,'emopen');
                // request.body.content = request.body.content.replace(/<\/strong>/ig,'boldclose');
                // request.body.content = request.body.content.replace(/<\/b>/ig,'boldclose');
                // request.body.content = request.body.content.replace(/<\/em>/ig,'emclose');
                // request.body.content = request.body.content.replace(/<\/i>/ig,'emclose');
                var xml = '';
                var xmlDoc = new xmlParse.DOM(xmlParse.parse((request.body.content).trim()));
                if (xmlDoc.document.getElementsByTagName('citation').length === 1) {
                    var citeId = (xmlDoc.document.getElementsByTagName('citation')[0].attributes.id !== undefined) ?
                        xmlDoc.document.getElementsByTagName('citation')[0].attributes.id : 'MAH';
                    xml = "<citation id='" + citeId + "'>";
                }
                xml += (request.body.type != 0 || request.body.type != '') ? "<type>" + request.body.type + "</type>" : ''
                if (xmlDoc.document.getElementsByTagName('bibarticle').length == 1) {
                    xml += "<bibarticle>";
                    xml += getAuthordetail(xmlDoc, 'bibarticle', builder, 'bibauthorname');
                    xml += getXmltag(xmlDoc, builder, 'etal', 3);
                    xml += getXmltag(xmlDoc, builder, 'year', 1);
                    xml += getTitle(xmlDoc, 'articletitle', builder);
                    xml += getAllotherdetails(xmlDoc, ['journaltitle', 'volumeid', 'issueid', 'firstpage', 'lastpage'], builder);
                    xml += "</bibarticle>";
                }
                if (xmlDoc.document.getElementsByTagName('bibbook').length == 1) {
                    xml += "<bibbook>";
                    xml += getAuthordetail(xmlDoc, 'bibbook', builder, 'bibauthorname');
                    xml += getXmltag(xmlDoc, builder, 'etal', 3);
                    xml += getXmltag(xmlDoc, builder, 'year', 1);
                    xml += getTitle(xmlDoc, 'booktitle', builder);
                    xml += getAllotherdetails(xmlDoc, ['editionnumber', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments'], builder)
                    xml += "</bibbook>";
                }
                if (xmlDoc.document.getElementsByTagName('bibchapter').length == 1) {
                    xml += "<bibchapter>";
                    xml += getAuthordetail(xmlDoc, 'bibchapter', builder, 'bibauthorname');
                    xml += getXmltag(xmlDoc, builder, 'etal', 3);
                    xml += getXmltag(xmlDoc, builder, 'year', 1);
                    xml += getTitle(xmlDoc, 'chaptertitle', builder);
                    xml += getEditor(xmlDoc, 'bibeditorname', builder);
                    xml += getAllotherdetails(xmlDoc, ['eds', 'booktitle', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments'], builder)
                    xml += "</bibchapter>";
                }
                xml += getXmltag(xmlDoc, builder, 'bibunstructured', 1);
                xml += "</citation>";
                xml = replaceContent(xml);
                var parseString = xml2js.parseString;
                parseString(xml.trim(),
                    {
                        explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' }, attrkey: '@',
                        preserveChildrenOrder: true, explicitRoot: true, mergeAttrs: false, ignoreAttrs: false, valueProcessors: []
                    }, (err, res) => {
                        if (err) {
                            console.log(err);
                            response.status(err.errno).send(JSON.stringify(err.Error));
                        }
                        response.status(200).send(JSON.stringify(res));
                    });
            }
            catch (err) {
                console.log(err);
                response.status(err.errno).send(JSON.stringify(err.Error));
            }
        }
        else if (request.body.token == 'jsontoxml') {
            try {
                var responseString = '';
                var data = (request.body.content);
                var parsedJson = JSON.parse(data);
                var keys = Object.keys(parsedJson['citation']);
                var bibtype = '';
                ['bibarticle', 'bibbook', 'bibchapter'].forEach(function (e) {
                    if (keys.indexOf(e) > -1) {
                        bibtype = e;
                    }
                });
                ['etal', 'year', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments',
                    'publishername', 'publisherlocation', 'eds'].forEach(function (e) {
                        parsedJson = removeEmptyElement(parsedJson, bibtype, e);
                    });

                var xml = js2xmlparser.parse('sample', parsedJson, { doubleQuotes: false, useSelfClosingTagIfEmpty: false });
                
                xml = xml.replace(/<sample>/g, '');
                xml = xml.replace(/<\/sample>/g, '');
                xml = xml.replace(/<initials\/>/g, '<NoInitials/>');
                xml = xml.replace(/<articletitle language='En'\/>/ig, '<NoArticleTitle/>');
                xml = xml.replace("<?xml version='1.0'?>", '');
                xml = xml.replace(/\n/g, '');
                xml = xml.replace(/\s{2,}/g, '');
                xml = xml.replace(/<sample>/g, '');
                xml = xml.replace(/<\/sample>/g, '');
                xml = xml.replace("<?xml version='1.0'?>", '');
                xml = xml.replace(/\n/g, '');
                xml = xml.replace(/\s{2,}/g, '');
                xml = xml.replace(/initials/g, 'Initials');
                xml = xml.replace(/familyname/g, 'FamilyName');
                xml = xml.replace(/bibchapter/g, 'BibChapter');
                xml = xml.replace(/bibauthorname/g, 'BibAuthorName');
                xml = xml.replace(/bibeditorname/g, 'BibEditorName');
                xml = xml.replace(/year/g, 'Year');
                xml = xml.replace(/eds/g, 'Eds');
                xml = xml.replace(/etal/g, 'Etal');
                xml = xml.replace(/chaptertitle/g, 'ChapterTitle');
                xml = xml.replace(/journaltitle/g, 'JournalTitle');
                xml = xml.replace(/articletitle/g, 'ArticleTitle');
                xml = xml.replace(/language/g, 'Language');
                xml = xml.replace(/booktitle/g, 'BookTitle');
                xml = xml.replace(/volumeid/g, 'VolumeID');
                xml = xml.replace(/issueid/g, 'IssueID');
                xml = xml.replace(/firstpage/g, 'FirstPage');
                xml = xml.replace(/lastpage/g, 'LastPage');
                xml = xml.replace(/publishername/g, 'PublisherName');
                xml = xml.replace(/publisherlocation/g, 'PublisherLocation');
                xml = xml.replace(/bibbookdoi/g, 'BibBookDOI');
                xml = xml.replace(/bibcomments/g, 'BibComments');
                xml = xml.replace(/bibarticle/g, 'BibArticle');
                xml = xml.replace(/citation/g, 'Citation');
                xml = xml.replace(/bibbook/g, 'BibBook');
                xml = xml.replace(/bibunstructured/g, 'BibUnstructured');
                xml = xml.replace(/id/g, 'ID');
                xml = xml.replace(/'/g, '"');
                let buff = Buffer.alloc(xml.length, xml);
                base64data = buff.toString('base64');
                var options =
                {
                    host: '10.110.3.250', port: 8080, path: "/RefbusWeb/rest/refbus/springer?journame=Basic", method: 'POST',
                    headers: { 'content-length': Buffer.byteLength(base64data), 'content-type': 'application/octet-stream', 'accept': '*/*' }
                };
                req = http.request(options, (res) => {
                    res.setEncoding('utf8');
                    res.on("data", function (data) {
                        responseString += data;
                    });
                    res.on("end", () => {
                        decodedtxt = Buffer.from(responseString, 'base64').toString("utf8");
                        var parseString = xml2js.parseString;
                        parseString(decodedtxt, {
                            explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": "" },
                            attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
                            explicitRoot: true, tagNameProcessors: [nameToLowerCase], valueProcessors: [escapeHtml]
                        }, (err, res) => {
                                if (err) {
                                    console.log(err);
                                    response.status(err.errno).send(JSON.stringify(err.Error));
                                }
                                if (res != undefined) {
                                    if (res['citation']['refbuslog']) {
                                        delete res['citation']['refbuslog'];
                                    }
                                    if (res['citation']['type'] && (request.body.type == 0 || request.body.type == '')) {
                                        delete res['citation']['type'];
                                    }
                                    var refBus = js2xmlparser.parse('sample', res, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });

                                    refBus = refBus.replace(/<sample>/g, '');
                                    refBus = refBus.replace(/citation/, 'div class="Citation"');
                                    refBus = refBus.replace(/Language/g, 'language');
                                    refBus = refBus.replace(/<\/sample>/g, '');
                                    refBus = refBus.replace(/<\/citation>/, '</div>');
                                    refBus = refBus.replace(/\n/g, '');
                                    refBus = refBus.replace(/&lt;/g, '<');
                                    refBus = refBus.replace(/&gt;/g, '>');
                                    refBus = refBus.replace(/\s{2,}/g, '');
                                    refBus = refBus.replace(/<bibarticle>/, '<div class=\"BibStructured\"><bibarticle>');
                                    refBus = refBus.replace(/<bibbook>/, '<div class=\"BibStructured\"><bibbook>');
                                    refBus = refBus.replace(/<bibchapter>/, '<div class=\"BibStructured\"><bibchapter>');
                                    refBus = refBus.replace(/<bibunstructured>/, '<div class=\"BibUnstructured\">');
                                    refBus = refBus.replace(/<\/bibarticle>/, '</bibarticle></div>');
                                    refBus = refBus.replace(/<\/bibbook>/, '</bibbook></div>');
                                    refBus = refBus.replace(/<\/bibchapter>/, '</bibchapter></div>');
                                    refBus = refBus.replace(/<\/bibunstructured>/, '</div>');
                                    refBus = refBus.replace(/<noinitials><\/noinitials>/g, '<initials></initials>');
                                    refBus = refBus.replace(/<noarticletitle><\/noarticletitle>/, '<articletitle language="En"></articletitle>');
                                    if (request.body.type != 0 || request.body.type != '') {
                                        refBus = refBus.replace(/<type>/, '<span name="CitationNumber" class="EditNotAllowed" title="Label Editing not allowed">');
                                        refBus = refBus.replace(/<\/type>/, '</span>');
                                    }
                                    response.status(200).send(refBus);
                                }
                                else {
                                    response.status(400).send('Unable to process the request');
                                }
                            });
                    });
                });
                req.on('error', (err) => {
                    console.error("problem with request: " + err);
                    response.status(err.errno).send(JSON.stringify(err.Error));
                });
                req.write(base64data);
                req.end();
            }
            catch (error) {
                console.error("problem with request: " + error);
                response.json({ status: 404, msg: "error" });
            }
        }
        else if (request.body.token == 'bibunstructured') {
            try {
                var type = request.body.type;
                responseString = '';
                var contents = request.body.content;
                contents = contents.replace(/<div class="BibUnstructured">/g, '<bibunstructured>');
                contents = contents.replace(/<\/div>/g, '</bibunstructured>');
                contents = contents.replace(/<bibunstructured>/, '');
                contents = contents.replace(/<\/bibunstructured>/, '');

                var res =
                {
                    "ref_items": [{ "@id": type, "refin": contents }], "noml": "1", "reftype": "1"
                }
                var buff = new Buffer(JSON.stringify(res)).toString("base64");
                console.log(buff);
                //response.send('TESt');
                var options =
                {
                    host: '10.110.3.250', port: 8088, path: "/refconv", method: 'POST',
                    headers: { 'content-length': Buffer.byteLength(buff), 'content-type': 'application/octet-stream', 'accept': '*/*' }
                };
                req = http.request(options, (res) => {
                    res.setEncoding('utf8');
                    res.on("data", function (data) {
                        responseString += data;
                    });
                    res.on("end", () => {
                        decodedtxt = Buffer.from(responseString, 'base64').toString("utf8");
                        var parsedjson = JSON.parse(decodedtxt);
                        var refout = parsedjson.ref_items[0].refout;
                        var xmlDoc = new xmlParse.DOM(xmlParse.parse((refout).trim()));
                        var citation = xmlDoc.document.getElementsByTagName('Citation')[0];
                        console.log(refout);

                        if (xmlDoc.document.getElementsByTagName('ERROR').length == 1) {
                            var erroroutput = [{ 'citation': { '@': { 'id': 0 }, 'citationnumber': [{ '#': '' }], 'type': [{ '#': 0 }], 'bibarticle': [{ 'bibauthorname': [{ 'initials': [{ '#': '' }], 'familyname': [{ '#': '' }] }], 'etal': [{ '#': '' }], 'year': [{ '#': '' }], 'articletitle': [{ '#': '', '@': { 'language': '' } }], 'journaltitle': [{ '#': '' }], 'volumeid': [{ '#': '' }], 'issueid': [{ '#': '' }], 'firstpage': [{ '#': '' }], 'lastpage': [{ '#': '' }] }], 'bibbook': [{ 'bibauthorname': [{ 'initials': [{ '#': '' }], 'familyname': [{ '#': '' }] }], 'year': [{ '#': '' }], 'booktitle': [{ '#': '', '@': { 'language': '' } }], 'editionnumber': [{ '#': '' }], 'publishername': [{ '#': '' }], 'publisherlocation': [{ '#': '' }], 'firstpage': [{ '#': '' }], 'lastpage': [{ '#': '' }], 'bibbookdoi': [{ '#': '' }], 'bibcomments': [{ '#': '' }] }], 'bibchapter': [{ 'bibauthorname': [{ 'initials': [{ '#': '' }], 'familyname': [{ '#': '' }] }], 'year': [{ '#': '' }], 'chaptertitle': [{ '#': '', '@': { 'language': '' } }], 'bibeditorname': [{ 'initials': [{ '#': '' }], 'familyname': [{ '#': '' }] }], 'eds': [{ '#': '' }], 'booktitle': [{ '#': '' }], 'publishername': [{ '#': '' }], 'publisherlocation': [{ '#': '' }], 'firstpage': [{ '#': '' }], 'lastpage': [{ '#': '' }], 'bibbookdoi': [{ '#': '' }], 'bibcomments': [{ '#': '' }] }] } }];
                            response.status(300).send(erroroutput);
                        }
                        else if (xmlDoc.document.getElementsByTagName('Citation').length == 1) {
                            var parseString = xml2js.parseString;
                            parseString(refout,
                                {
                                    explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": "" },
                                    attrkey: '@', explicitRoot: true, tagNameProcessors: [nameToLowerCase], valueProcessors: [ReplaceTag], normalize: true,
                                    attrNameProcessors: [nameToLowerCase]
                                }, (err, res) => {
                                    if (res !== undefined) {
                                        res['citation']['bibunstructured'] = [{ "#": "" }];
                                    }
                                    var refBus = js2xmlparser.parse('sample', res, { useSelfClosingTagIfEmpty: false }, { formatOptions: { doubleQuotes: true } });
                                    var options = {
                                        method: 'POST',
                                        url: 'http://10.110.24.201:3000/reference1',
                                        headers:
                                        {
                                            'cache-control': 'no-cache',
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        },
                                        form:
                                        {

                                            token: 'xmltojson',
                                            content: refBus,
                                            type: request.body.type
                                        }
                                    };

                                    httprequest(options, function (error, response2, body) {
                                        if (error) throw new Error(error);
                                        console.log(body)
                                        response.status(200).send(body);
                                    });

                                    if (res !== undefined) {
                                        res['citation']['bibunstructured'] = [{ "#": "" }];
                                    }
                                })
                        }
                    });
                });
                req.on('error', (e) => {
                    console.log(e);
                    console.error("problem with request: " + e);
                    return JSON.stringify(e);
                });
                req.write(buff);
                req.end();
            }
            catch (error) {
                console.error("problem with request: " + error);
                response.json({ status: 404, msg: "error" });
            }
        }
        else {
            response.status(400).send(JSON.stringify({ 'ErrorCode': 'Unsupported request argument' }));
        }
    }
});
module.exports = reference1;


