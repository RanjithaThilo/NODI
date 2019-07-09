let affiliation = require('express').Router();
let js2xmlparser = require("js2xmlparser");
let xml2js = require('xml2js');
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
let fun = require('./functions.js')

affiliation.use(function timeLog(request, res, next){
	console.log("Affiliation Edit XML " + request.method + " Request Received at " + Date.now() + "\n");
	next()
});
affiliation.get('/', function (request, response, next) {
	response.status(400).send(JSON.stringify({ 'error': 'get process cannot be done. please use post' }));
});
affiliation.post('/', function (request, response, next) {
	if (request.body.token == undefined || request.body.token == '') {

		response.status(400).send(JSON.stringify({ 'ErrorCode': 'Type argument was not supplied' }));
	}
	else if (request.body.content == undefined || request.body.content == '') {
		response.status(400).send(JSON.stringify({ 'ErrorCode': 'content argument was not supplied' }));
	}
	else {
		if (request.body.token === 'xmltojson')
		{
			try 
			{
				var doc = new dom().parseFromString(request.body.content);
				var id = (xpath.select1("//affiliation/@id", doc)!==undefined) ? xpath.select1("//affiliation/@id", doc).value : '';
				var xml = "<affiliation id=\""+id+"\">";
				xml+=(xpath.select("//orgdivision", doc).length) ? xpath.select("//orgdivision", doc).toString() : "<orgdivision></orgdivision>";
				xml+=(xpath.select("//orgname", doc).length) ? xpath.select("//orgname", doc).toString() : "<orgname></orgname>";
				if(xpath.select("//affiliation/orgaddress",doc).length)
				{
					var node = xpath.select("//affiliation/orgaddress",doc)
					node.forEach(function(element)
					{
						var innerDom = new dom().parseFromString(element.toString());
						xml+="<orgaddress>";
						['street','postbox','city','state','postcode','country'].forEach(function(tag)
						{
							if(tag === 'country')
							{
								var code = (xpath.select1("//orgaddress/"+tag+"/@code", innerDom)!==undefined) ? xpath.select1("//orgaddress/"+tag+"/@code", innerDom).value : '';
								xml+=(xpath.select("//orgaddress/"+tag, innerDom).length) ? "<"+tag+" code=\""+code+"\">"+xpath.select("string(//orgaddress/"+tag+")", innerDom)+"</"+tag+">" : "<"+tag+" code=\""+code+"\"></"+tag+">";
							}
							else
							{
								xml+=(xpath.select("//orgaddress/"+tag, innerDom).length) ? xpath.select("//orgaddress/"+tag, innerDom).toString() : "<"+tag+"></"+tag+">";
							}
						});
						xml+="</orgaddress>";
					})
				}
				else
				{
					xml+="<orgaddress><street></street><postbox></postbox><city></city><state></state><postcode></postcode>";
					xml+="<country></country></orgaddress>";
				}
				xml+="</affiliation>";
				xml2js.parseString(xml, {explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
				attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
				explicitRoot: true}, (err, res) =>
				{
					if(err)
					{
						console.log(err);
						response.status(300).send(JSON.stringify(err));
						return;
					}
					response.status(200).send(JSON.stringify(res));
				});
			}
			catch (err) {
				console.log(err);
				response.status(400).send({msg: "error" });
			}
		}
		else if (request.body.token === 'jsontoxml') {
			try 
			{
				
				var data = JSON.parse(request.body.content);
				if(data.affiliation.orgdivision!==undefined && data.affiliation.orgdivision[0]['#']==='')
				{
					delete data.affiliation.orgdivision;
				}
				['street','postbox','city','state','postcode'].forEach(function(e)
				{
					data = fun.removeEmptyElement(data,'affiliation','orgaddress',e);
				});
				var xml = js2xmlparser.parse('sample', data,
				{ 
					useSelfClosingTagIfEmpty: false,
					format:{doubleQuotes:true,pretty: true},
					declaration: { include: false}
				});
				xml = xml.replace(/\n/g, '');
				xml = xml.replace(/\s{2,}/g, '');
				xml = xml.replace('<sample>', '');
				xml = xml.replace('</sample>', '');
				response.status(200).send(xml.trim());
			}
			catch (error) {
				console.log(error);
				response.status(400).send({msg: "error" });
			}
		}
		else {
			response.status(400).send(JSON.stringify({ 'ErrorCode': 'Unsupported request argument' }));
		}
	}
});

module.exports = affiliation;