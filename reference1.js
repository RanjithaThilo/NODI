let reference1 = require('express').Router();
let config = require('./config.json');
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
let xml2js = require('xml2js');
let js2xmlparser = require("js2xmlparser");
let redBus = require('./token.js');
let http = require('http');
let httprequest = require('request');
let fun = require('./functions.js');
const utf8 = require('utf8');
var base64 = require('base-64');


function getAuthordetail1(doc, element) {
	var values = "";
	var nodes = xpath.select(element, doc)
	nodes.forEach(function (processAuthor) {
		var author = processAuthor.toString();
		if (author.search(/<initials/ig) === -1) {
			author = author.replace(/<bibauthorname>/ig, '<bibauthorname><initials> </initials>');
		}
		values = values + author
	})
	return values
}
function removeEmptyElement(parsedJson, bibtype, tag) {
	if (tag == 'etal') {
		if (parsedJson["citation"][bibtype][0][tag] !== undefined) {
			if (parsedJson["citation"][bibtype][0][tag][0]['#'] == 'no') {
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

reference1.post('/', function (request, response, next) {
	if (request.body.token == 'xmltojson') {
		try {
			var data = request.body.content;
			data = data.replace(/\n/g, '');
			data = data.replace(/\t/g, '');
			data = data.replace(/\s{2,}/g, '');
			data = data.replace(/<etal>\s*?<\/etal>/g, '<etal>yes</etal>');
			data = data.toString().trim().replace(/(\r\n|\n|\r)/g, "");
			data = data.replace(/noarticletitle/g, 'articletitle');
			data = data.replace(/nogivenname/g, 'givenname');
			data = data.replace(/noinitials/g, 'initials');
			data = data.replace(/div class="Citation" ID/ig, 'citation id');
			data = data.replace(/Citation ID/ig, 'citation id');
			data = data.replace(/div class="BibStructured"/ig, 'bibstructured');
			data = data.replace(/<\/bibarticle><\/div>/ig, '</bibarticle></bibstructured>');
			data = data.replace(/<\/bibbook><\/div>/ig, '</bibbook></bibstructured>');
			data = data.replace(/<\/bibchapter><\/div>/ig, '</bibchapter></bibstructured>');

			var doc = new dom().parseFromString(data);
			var bibtype = "";
			if (xpath.select("//bibarticle", doc).length) {
				bibtype = "bibarticle";
			} else if (xpath.select("//bibbook", doc).length) {
				bibtype = "bibbook";
			} else {
				bibtype = "bibchapter"
			}

			['articletitle', 'journaltitle', 'chaptertitle', 'booktitle'].forEach(function (e) {
				doc = fun.escapeElements(e, doc, bibtype);
			});

			var id = (xpath.select1("//citation/@id", doc) !== undefined) ? xpath.select1("//citation/@id", doc).value : '';
			var xml = "<citation id=\"" + id + "\">";
			xml += (request.body.type != 0 || request.body.type != '') ? "<type>" + request.body.type.replace(/\./g, "") + ". </type>" : ''
			//xml += (request.body.type != 0 || request.body.type != '') ? "<type>" + request.body.type + ". </type>" : ''
			if (xpath.select("//bibarticle", doc).length) {
				xml += "<bibarticle>"
				xml += getAuthordetail1(doc, "//bibauthorname");
				if (xpath.select("//institutionalauthorname", doc).length) {
					xml += fun.getAllother(doc, ["institutionalauthorname"]);
				}
				xml += (xpath.select("//etal", doc).length) ? xpath.select("//etal", doc).toString() : "<etal>no</etal>";
				xml += (xpath.select("//year", doc).length) ? xpath.select("//year", doc).toString() : "<year> </year>";
				xml += (xpath.select("//articletitle", doc).length) ? xpath.select("//articletitle", doc).toString() : "<articletitle language=\"En\"> </articletitle>";
				xml += (xpath.select("//journaltitle", doc).length) ? xpath.select("//journaltitle", doc).toString() : "<journaltitle language=\"En\"> </journaltitle>";
				xml += fun.getAllother(doc, ['volumeid', 'issueid', 'firstpage', 'lastpage', 'bibarticledoi', 'bibcomments']);
				xml += "</bibarticle><bibunstructured> </bibunstructured></citation>"
			}
			else if (xpath.select("//bibbook", doc).length) {
				xml += "<bibbook>"
				xml += getAuthordetail1(doc, "//bibauthorname");
				if (xpath.select("//institutionalauthorname", doc).length) {
					xml += fun.getAllother(doc, ["institutionalauthorname"]);
				}
				xml += (xpath.select("//etal", doc).length) ? xpath.select("//etal", doc).toString() : "<etal>no</etal>";
				xml += (xpath.select("//year", doc).length) ? xpath.select("//year", doc).toString() : "<year> </year>";
				xml += (xpath.select("//booktitle", doc).length) ? xpath.select("//booktitle", doc).toString() : "<booktitle language=\"En\"> </booktitle>";
				xml += fun.getAllother(doc, ['editionnumber', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments']);
				xml += "</bibbook><bibunstructured> </bibunstructured></citation>"
			}
			else if (xpath.select("//bibchapter", doc).length) {
				xml += "<bibchapter>"
				xml += getAuthordetail1(doc, "//bibauthorname");
				console.log(xpath.select("//etal", doc).toString());
				//xml += (xpath.select("//etal", doc).length) ? xpath.select("//etal", doc).toString(): "<etal>no</etal>";
				if (xpath.select("//etal", doc).length) {
					xpath.select("//etal", doc).forEach(function (e) {
						console.log(e.childNodes[0].nodeValue);
						xml += "<etal>" + e.childNodes[0].nodeValue + "</etal>";
					})
				}
				if (xpath.select("//institutionalauthorname", doc).length) {
					xml += fun.getAllother(doc, ["institutionalauthorname"]);
				}
				xml += (xpath.select("//year", doc).length) ? xpath.select("//year", doc).toString() : "<year> </year>";
				xml += (xpath.select("//chaptertitle", doc).length) ? xpath.select("//chaptertitle", doc).toString() : "<chaptertitle language=\"En\"> </chaptertitle>";
				xml += getAuthordetail1(doc, "//bibeditorname");
				xml += fun.getAllother(doc, ['eds', 'booktitle', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibchapterdoi', 'bibcomments']);
				xml += "</bibchapter><bibunstructured> </bibunstructured></citation>"
			}
			else {
				response.status(300).send({ message: "There was a problem in processing the details provided" });
			}
			var parseString = xml2js.parseString;
			//console.log('xml', xml);
			parseString(xml, {
				explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
				attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
				valueProcesser: [fun.replaceTag], explicitRoot: true
			}, (err, res) => {
				if (err) {
					console.log(err);
					response.status(100).send(JSON.stringify(err));
				}
				if (xpath.select("//bibchapter", doc).length) {
					var authoretal = [];
					authoretal.push(res.citation.bibchapter[0].etal[0]['#']);
					var editoretal = [];
					editoretal.push(res.citation.bibchapter[0].etal[1]['#']);
					delete res.citation.bibchapter[0].etal;
					res.citation.bibchapter[0].authoretal = [{ "#": authoretal[0] }]
					res.citation.bibchapter[0].editoretal = [{ "#": editoretal[0] }];

					console.log('res', JSON.stringify(res));
				}
				console.log('res', JSON.stringify(res));
				response.status(200).send(JSON.stringify(res));
			});
		}
		catch (err) {
			console.log(err)
			response.status(400).send(JSON.stringify(err.Error));
		}
	}
	else if (request.body.token == 'jsontoxml') {
		try {
			var responseString = '';
			var data = (request.body.content);
			var parsedJson = JSON.parse(data);
			console.log('parsedJson', parsedJson);
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

			['authoretal', 'editoretal', 'year', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments',
				'publishername', 'publisherlocation', 'eds'].forEach(function (e) {
					parsedJson = removeEmptyElement(parsedJson, bibtype, e);
				});

			var xml = js2xmlparser.parse('sample', parsedJson, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });

			xml = xml.replace(/<sample>/g, '');
			xml = xml.replace(/<\/sample>/g, '');
			xml = xml.replace(/<initials\/>/g, '<NoInitials/>');
			xml = xml.replace(/<articletitle language='En'\/>/ig, '<NoArticleTitle/>');
			xml = xml.replace(/\n/g, '');
			xml = xml.replace(/\s{2,}/g, '');
			var nodenames = {
				initials: "Initials", familyname: "FamilyName", bibchapter: "BibChapter", bibauthorname: "BibAuthorName",
				bibeditorname: "BibEditorName", year: "Year", volumeid: "VolumeID", issueid: "IssueID", firstpage: "FirstPage",
				lastpage: "LastPage", publishername: "PublisherName", publisherlocation: "PublisherLocation", bibbookdoi: "bibbookdoi",
				bibcomments: "BibComments", bibarticle: "BibArticle", citation: "Citation", bibbook: "BibBook",
				bibunstructured: "BibUnstructured", journaltitle: "JournalTitle", articletitle: "ArticleTitle",
				chaptertitle: "ChapterTitle", authoretal: "Etal",editoretal: "Etal", language: "Language", booktitle: "BookTitle"
			}
			var doc = new dom().parseFromString(xml);
			var nodes = xpath.select("//*", doc);
			Object.keys(nodes).forEach(function (value) {
				Object.keys(nodenames).forEach(function (key) {
					xml = xml.replace(key, nodenames[key]);
				});
			})
			var bytes = utf8.encode(xml);
			var base64data = base64.encode(bytes);
			var options =
			{
				host: config.refmlServer, port: config.refmlServerPort, path: config.refmlPath, method: 'POST',
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
						explicitRoot: true, tagNameProcessors: [fun.nameToLowerCase], valueProcessors: [fun.escapeHtml]
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
							if (res['citation']['bibarticle'] !== undefined) {
								if (res['citation']['bibarticle'][0]['etal'] !== undefined && (res['citation']['bibarticle'][0]['etal'][0]['#'] === 'Yes' || res['citation']['bibarticle'][0]['etal'][0]['#'] === 'yes')) {
									res['citation']['bibarticle'][0]['etal'][0]['#'] = ' ';
								}
							}
							if (res['citation']['bibbook'] !== undefined) {
								if (res['citation']['bibbook'][0]['etal'] !== undefined && (res['citation']['bibbook'][0]['etal'][0]['#'] === 'Yes' || res['citation']['bibbook'][0]['etal'][0]['#'] === 'yes')) {
									res['citation']['bibbook'][0]['etal'][0]['#'] = ' ';
								}
							}
							if (res['citation']['bibchapter'] !== undefined) {
								if (res['citation']['bibchapter'][0]['etal'] !== undefined && (res['citation']['bibchapter'][0]['etal'][0]['#'] === 'Yes' || res['citation']['bibchapter'][0]['etal'][0]['#'] === 'yes')) {
									res['citation']['bibchapter'][0]['etal'][0]['#'] = ' ';
								}
							}
							console.log('res',JSON.stringify(res));
							var refBus = js2xmlparser.parse('sample', res, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });

							refBus = refBus.replace(/<sample>/g, '');
							refBus = refBus.replace(/&amp;nbsp;/g, ' ');
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
							refBus = refBus.replace(/<initials><\/initials>/ig, '<noinitials><\/noinitials>');
							refBus = refBus.replace(/<articletitle language="En"><\/articletitle>/, '/<noarticletitle><\/noarticletitle>');
							if (request.body.type != 0 || request.body.type != '') {
								refBus = refBus.replace(/<type>/, '<span name="CitationNumber" class="EditNotAllowed" title="Label Editing not allowed">');
								refBus = refBus.replace(/<\/type>/, '. </span>');
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
				response.status(400).send(JSON.stringify(err));
			});
			req.write(base64data);
			req.end();
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
	else if (request.body.token == 'bibunstructured') {

		try {
			var type = request.body.type;
			responseString = '';
			var contents = request.body.content;
			contents = contents.replace(/<div class="BibUnstructured">/ig, "");
			contents = contents.replace(/<\/div>/ig, "");
			contents = fun.tagProcess(contents)

			var res = {
				"ref_items":
					[{ "@id": type, "refin": contents }], "noml": "1", "reftype": "1"
			}
			//--no-deprecation
			var buff = new Buffer(JSON.stringify(res)).toString("base64");
			var options =
			{
				host: config.arsServer, port: config.arsServerPort, path: config.arsPath, method: 'POST',
				headers: { 'content-length': Buffer.byteLength(buff), 'content-type': 'application/octet-stream', 'accept': '*/*' }
			};
			req = http.request(options, (res) => {
				res.setEncoding('utf8');
				res.on("data", function (data) { responseString += data; });
				res.on("end", () => {
					decodedtxt = Buffer.from(responseString, 'base64').toString("utf8");
					var parsedjson = JSON.parse(decodedtxt);
					var refout = parsedjson.ref_items[0].refout;
					refout = refout.replace(/<check>/ig, '');
					refout = refout.replace(/<\/check>/ig, '');
					var xmlDoc = new dom().parseFromString(refout);

					if (xpath.select("//Citation/ERROR", xmlDoc).length) {
						console.log('error check output');
						var erroroutput = [{ "citation": { "@": { "id": 0 }, "type": [{ "#": 0 }], "bibarticle": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "articletitle": [{ "#": "", "@": { "language": "En" } }], "journaltitle": [{ "#": "" }], "volumeid": [{ "#": "" }], "issueid": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }] }], "bibbook": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "booktitle": [{ "#": "", "@": { "language": "En" } }], "editionnumber": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibchapter": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "authoretal": [{ "#": "No" }], "editoretal": [{ "#": "No" }], "year": [{ "#": "" }], "chaptertitle": [{ "#": "", "@": { "language": "En" } }], "bibeditorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "eds": [{ "#": "" }], "booktitle": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibunstructured": [{ "#": "" }] } }]
						//	var erroroutput = [{ "citation": { "@": { "id": 0 }, "type": [{ "#": 0 }], "bibarticle": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "articletitle": [{ "#": "", "@": { "language": "En" } }], "journaltitle": [{ "#": "" }], "volumeid": [{ "#": "" }], "issueid": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }] }], "bibbook": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "booktitle": [{ "#": "", "@": { "language": "En" } }], "editionnumber": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibchapter": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "chaptertitle": [{ "#": "", "@": { "language": "En" } }], "bibeditorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "eds": [{ "#": "" }], "booktitle": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibunstructured": [{ "#": "" }] } }];
						response.status(300).send(erroroutput);
					}
					else {
						var parseString = xml2js.parseString;
						parseString(refout,
							{
								explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": "" },
								attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
								explicitRoot: true, tagNameProcessors: [fun.nameToLowerCase]
							}, (err, res) => {
								var refBus = js2xmlparser.parse('sample', res, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });
								refBus = refBus.replace(/<sample>/g, '');
								refBus = refBus.replace(/<\/sample>/g, '');
								refBus += "<bibunstructured></bibunstructured>";
								console.log('refBus', refBus);
								httprequest.post(config.refRecal,
									{
										form:
										{
											token: 'xmltojson',
											content: refBus,
											type: request.body.type
										}
									}, (error, res, body) => {
										if (error) {
											console.error(error)
											response.status(400).send(JSON.stringify(error));
										}
										response.status(200).send(body);
									})
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
		finally {
			if (response.statusCode !== 200)
				response.status(300).send(JSON.stringify("Unknown Error"));
		}
	}
	else {
		response.status(400).send(JSON.stringify({ 'ErrorCode': 'Unsupported request argument' }));
	}
});

reference1.get('/', function (request, response, next) {
	response.status(400).send(JSON.stringify({ 'error': 'get process cannot be done. please use post' }));
});


module.exports = reference1;