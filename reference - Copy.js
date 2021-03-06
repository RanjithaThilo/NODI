let reference = require('express').Router();
let js2xmlparser = require("js2xmlparser");
let xml2js = require('xml2js');
let redBus = require('./token.js');
let http = require('http');

const { parseString } = require('xml2js')
const xmlParse = require("xml-parse");
var builder = require('xmlbuilder');
var base64data = '',decodedtxt = '',responseString = '';

reference.use(function timeLog (request, res, next) 
{
	console.log("reference " + request.method + " Request Received at "+Date.now() + "\n");
	next()
});
reference.get('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'get process cannot be done. please use post'}));
});
reference.post('/', function (request, response,next)
{
	if(request.body.token==undefined || request.body.token =='')
	{
		response.status(400).send(JSON.stringify({'ErrorCode' : 'Type argument was not supplied'}));
	}
	else if(request.body.content==undefined || request.body.content =='')
	{
		response.status(400).send(JSON.stringify({'ErrorCode' : 'content argument was not supplied'}));
	}
	else
	{
		if(request.body.token=='xmltojson')
		{
			try
			{
				var xmlDoc = new xmlParse.DOM(xmlParse.parse((request.body.content).trim()));
				var xml = '';
				if(xmlDoc.document.getElementsByTagName('bibarticle').length==1)
				{
					var citaId = (xmlDoc.document.getElementsByTagName("citation")[0] ===undefined) ? "" : xmlDoc.document.getElementsByTagName("citation")[0].attributes.id;
					xml = "<citation id='"+citaId+"'>";
					xml+=(xmlDoc.document.getElementsByTagName('citationnumber').length==0) ? builder.create('citationnumber') : builder.create('citationnumber').text((xmlDoc.document.getElementsByTagName("CitationNumber")[0]['innerXML']).trim())
					xml+= '<bibarticle>'
					if(xmlDoc.document.getElementsByTagName('bibauthorname').length==0)
					{
						var root = builder.create('bibauthorname');
						['initials','firstname'].forEach(function(e)
						{
							root.ele(e);
						})
						xml+= root;
					}
					else
					{
						for(var i =0;i<xmlDoc.document.getElementsByTagName("bibauthorname").length;i++)
						{
							var root = builder.create('bibauthorname').text(((xmlDoc.document.getElementsByTagName("bibauthorname")[i].innerXML).replace(/\n/g,'')).trim());
							xml+= root;
						}
						
					}
					['etal','year','articletitle','journaltitle','volumeid','issueid','firstpage','lastpage'].forEach(function(e)
					{
						if(e == 'articletitle')
						{
							var langAttr = (xmlDoc.document.getElementsByTagName("articletitle")[0].attributes.language===undefined) ? "" : xmlDoc.document.getElementsByTagName("articletitle")[0].attributes.language;
							xml+=(xmlDoc.document.getElementsByTagName(e).length==0) ? builder.create('noarticletitle') : builder.create(e).ele(e,{'language': langAttr}).text((xmlDoc.document.getElementsByTagName(e)[0]['innerXML']).trim())
						}
						else
						xml+=(xmlDoc.document.getElementsByTagName(e).length==0) ? builder.create(e) : builder.create(e).text((xmlDoc.document.getElementsByTagName(e)[0]['innerXML']).trim())
					})
					xml+= '</bibarticle>'
					xml+=(xmlDoc.document.getElementsByTagName('bibunstructured').length==0) ? builder.create('bibunstructured') : builder.create('bibunstructured').text((xmlDoc.document.getElementsByTagName('bibunstructured')[0]['innerXML']).trim())
					xml+= "</citation>";				
				}
				if(xmlDoc.document.getElementsByTagName('bibbook').length==1)
				{
					var xmlDoc = new xmlParse.DOM(xmlParse.parse((request.body.content).trim()));
					xml+= '<bibbook>';
					if(xmlDoc.document.getElementsByTagName('bibauthorname').length==0)
					{
						var root = builder.create('bibauthorname');
						['initials','firstname'].forEach(function(e)
						{
							root.ele(e);
						})
						xml+= root;
					}
					else
					{
						for(var i =0;i<xmlDoc.document.getElementsByTagName("bibauthorname").length;i++)
						{
							var root = builder.create('bibauthorname').text(((xmlDoc.document.getElementsByTagName("bibauthorname")[i].innerXML).replace(/\n/g,'')).trim());
							xml+= root;
						}
					}
					['year','booktitle','editionnumber','publishername','publisherlocation','firstpage','lastpage','bibbookdoi','bibcomments'].forEach(function(e)
					{
						if(e == 'booktitle')
						{
							var langAttr = (xmlDoc.document.getElementsByTagName("booktitle")[0].attributes.Language===undefined) ? "" : xmlDoc.document.getElementsByTagName("ArticleTitle")[0].attributes.language;
							xml+=(xmlDoc.document.getElementsByTagName(e).length==0) ? builder.create('NoBookTitle') : builder.create(e).ele(e,{'language': langAttr}).text((xmlDoc.document.getElementsByTagName(e)[0]['innerXML']).trim())
						}	
						else
						xml+=(xmlDoc.document.getElementsByTagName(e).length==0) ? builder.create(e) : builder.create(e).text((xmlDoc.document.getElementsByTagName(e)[0]['innerXML']).trim())
					})
					xml+= '</bibbook>';
				}
				xml = xml.replace(/<?xml version=\"1.0\"?>/g,'');
				xml = xml.replace(/<?xml version="1.0"?>/g,'');
				xml = xml.replace(/&lt;/g,'<');
				xml = xml.replace(/&gt;/g,'>');
				xml = xml.replace(/\n/g,'>');
				xml = xml.replace(/                                               /g,'');
				var parseString = xml2js.parseString;
				parseString(xml,{explicitArray:true,explicitCharkey:true,trim :true,charkey:'#',emptyTag: {"#":''},
				attrkey : '@',preserveChildrenOrder:true,mergeAttrs :false,ignoreAttrs:false,charsAsChildren:true,
				explicitRoot:true},(err, res)=>
				{
					if(err)
					   console.log(err);
					   response.status(200).send(JSON.stringify(res));
				});
			}
			catch(error)
			{
				console.log(error);
				response.json({status:404,msg:"error"});
			}
		}
		else if(request.body.token=='jsontoxml')
		{
			try{
				//var xml = js2xmlparser.parse('Sample',request.body.content);
				var xml = js2xmlparser.parse('sample',JSON.parse(request.body.content),{useSelfClosingTagIfEmpty:false});
				console.log(xml);
				xml = xml.replace(/<sample>/g,'');
				xml = xml.replace(/<\/sample>/g,'');
				xml = xml.replace("<?xml version='1.0'?>",'');
				xml = xml.replace(/\n/g,'');
				xml = xml.replace(/                /g,'');
				xml = xml.replace(/            /g,'');
				xml = xml.replace(/        /g,'');				
				response.status(200).send(xml.trim());
			}
			catch(error){
				console.log(error);
				response.json({status:404,msg:"error"});
			}
		}
		else 
		{
			response.status(400).send(JSON.stringify({'ErrorCode' : 'Unsupported request argument'}));
		}
	}	
});
module.exports = reference;