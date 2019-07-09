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
			data = data.toString().trim().replace(/(\r\n|\n|\r)/g, "");
			//	data = data.replace(/noarticletitle/g, 'articletitle');
			//	data = data.replace(/nogivenname/g, 'givenname');
			//data = data.replace(/noinitials/g, 'initials');
			data = data.replace(/div class="Citation" ID/ig, 'citation id');
			var doc = new dom().parseFromString(data);
			['articletitle', 'journaltitle', 'chaptertitle', 'booktitle'].forEach(function (e) {
				doc = fun.escapeElements(e, doc);
			});

			if (xpath.select("//citation", doc).length) {
				var id = xpath.select1("//citation/@id", doc).value;
				var citation = doc.createElement('citation');
				citation.setAttribute('id', id);
			}
			if (request.body.type != '' || request.body.type != 0) {
				var textNode = doc.createTextNode(request.body.type);
				var type = doc.createElement('type');
				type.appendChild(textNode);
				citation.appendChild(type);
			}
			['bibarticle','bibbook','bibchapter'].forEach(function(e){
				if (xpath.select("//" + e, doc).length) {
					console.log('')
						var bibarticlele = doc.createElement(e);
					}

					if (xpath.select("//bibauthorname", doc).length) {
						var bibauthornameele = doc.createElement('bibauthorname');
						['bibauthorname'].forEach(function (e) {
							var initailsval = xpath.select("string(//initials)", doc);
							var textNode = doc.createTextNode(initailsval);
							var initials = doc.createElement('initials');
							initials.appendChild(textNode);
							bibauthornameele.appendChild(initials);
							var familynameval = xpath.select("string(//familyname)", doc);
							var textNode = doc.createTextNode(familynameval);
							var familyname = doc.createElement('familyname');
							familyname.appendChild(textNode);

							bibauthornameele.appendChild(familyname);
						})
					}
					bibarticlele.appendChild(bibauthornameele);

					if(e == 'bibarticle'){
						['etal', 'year', 'articletitle', 'journaltitle', 'volumeid', 'issueid', 'firstpage', 'lastpage'].forEach(function (tag) {
							var newcreele = fun.createEle(tag, doc);
							bibarticlele.appendChild(newcreele);
						})
					}else if(e == 'bibbook'){
						['etal', 'year', 'articletitle', 'journaltitle', 'volumeid', 'issueid', 'firstpage', 'lastpage'].forEach(function (tag) {
							var newcreele = fun.createEle(tag, doc);
							bibarticlele.appendChild(newcreele);
						})
					}else if (e == 'bibchapter'){
						['etal', 'year', 'chaptertitle', 'booktitle', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments'].forEach(function (tag) {
							var newcreele = fun.createEle(tag, doc);
							bibbook.appendChild(newcreele);
						})
					}
					
					citation.appendChild(bibarticlele);
			})
			 if (xpath.select("//bibchapter", doc).length) {
				if (xpath.select("//bibchapter", doc).length) {
					var bibbook = doc.createElement('bibchapter');
				}
				if (xpath.select("//bibauthorname", doc).length) {
					var bibauthornameele = doc.createElement('bibauthorname');
					//	['initials', 'familyname'].forEach(function (e) {
					['bibauthorname'].forEach(function (e) {
						var initailsval = xpath.select("string(//initials)", doc);
						var textNode = doc.createTextNode(initailsval);
						var initials = doc.createElement('initials');
						initials.appendChild(textNode);
						bibauthornameele.appendChild(initials);
						var familynameval = xpath.select("string(//familyname)", doc);
						var textNode = doc.createTextNode(familynameval);
						var familyname = doc.createElement('familyname');
						familyname.appendChild(textNode);
						bibauthornameele.appendChild(familyname);
					})

					//	})
				}

				['etal', 'year', 'chaptertitle', 'booktitle', 'publishername', 'publisherlocation', 'volumeid', 'issueid', 'firstpage', 'lastpage', 'bibbookdoi', 'bibcomments'].forEach(function (tag) {
					var newcreele = fun.createEle(tag, doc);
					bibbook.appendChild(newcreele);
				})
				citation.appendChild(bibbook);
			}
			else {
				response.status(300).send({ message: "There was a problem in processing the details provided" });
			}
			var parseString = xml2js.parseString;
			console.log('xml', xml);
			parseString(citation, {
				explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
				attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
				valueProcesser: [fun.replaceTag], explicitRoot: true
			}, (err, res) => {
				if (err) {
					console.log(err);
					response.status(100).send(JSON.stringify(err));
				}
				console.log('res', JSON.stringify(res));
				response.status(200).send(JSON.stringify(res));
			});
		}
		catch (err) {
			console.log(err)
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
			var xml = js2xmlparser.parse('sample', parsedJson, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true }, declaration: { include: false } });
			console.log('xml', xml);
			xml = xml.replace(/<sample>/g, '');
			xml = xml.replace(/<\/sample>/g, '');
			xml = xml.replace(/<initials\/>/g, '<NoInitials/>');
			xml = xml.replace(/<articletitle language='En'\/>/ig, '<NoArticleTitle/>');
			xml = xml.replace(/\n/g, '');
			xml = xml.replace(/\s{2,}/g, '');
			var nodenames = { initials: "Initials", familyname: "FamilyName", bibchapter: "BibChapter", bibauthorname: "BibAuthorName", bibeditorname: "BibEditorName", year: "Year", eds: "Eds", volumeid: "VolumeID", issueid: "IssueID", firstpage: "FirstPage", lastpage: "LastPage", publishername: "PublisherName", publisherlocation: "PublisherLocation", bibbookdoi: "bibbookdoi", bibcomments: "BibComments", bibarticle: "BibArticle", citation: "Citation", bibbook: "BibBook", bibunstructured: "BibUnstructured", id: "ID", journaltitle: "JournalTitle", articletitle: "ArticleTitle", chaptertitle: "ChapterTitle", etal: "Etal", language: "Language", booktitle: "BookTitle" }
			var doc = new dom().parseFromString(xml);
			var nodes = xpath.select("//*", doc);
			Object.keys(nodes).forEach(function (value) {
				console.log(nodes[value].nodeName);
				Object.keys(nodenames).forEach(function (key) {
					xml = xml.replace(key, nodenames[key]);
				});
			})
			console.log('xmlafterreplcafunc', xml);
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
								refBus = refBus.replace(/<\/type>/, '</span>');
							}
							// console.log('refBus',refBus);
							// 	refBus = fun.replaceTag(refBus);
							// 	console.log('after refBus',refBus);
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
						var erroroutput = [{ "citation": { "@": { "id": 0 }, "type": [{ "#": 0 }], "bibarticle": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "etal": [{ "#": "" }], "year": [{ "#": "" }], "articletitle": [{ "#": "", "@": { "language": "En" } }], "journaltitle": [{ "#": "" }], "volumeid": [{ "#": "" }], "issueid": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }] }], "bibbook": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "year": [{ "#": "" }], "booktitle": [{ "#": "", "@": { "language": "En" } }], "editionnumber": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibchapter": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "year": [{ "#": "" }], "chaptertitle": [{ "#": "", "@": { "language": "En" } }], "bibeditorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }], "eds": [{ "#": "" }], "booktitle": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }], "bibunstructured": [{ "#": "" }] } }];
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
										response.status(res.statusCode).send(body);
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