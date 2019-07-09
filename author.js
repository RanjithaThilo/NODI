let author = require('express').Router();
let js2xmlparser = require("js2xmlparser");
let xml2js = require('xml2js');
let { parseString } = require('xml2js')
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
let fun = require('./functions.js')

author.use(function timeLog (request, res, next) 
{
	console.log("Author " + request.method + " Request Received at "+Date.now() + "\n");
	next()
});
author.get('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'get process cannot be done. please use post'}));
});
author.post('/', function (request, response,next)
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
				
				var data = request.body.content;
				data = data.replace(/nogivenname/g,'givenname');
				data = fun.tagProcess(data);
				var doc = new dom().parseFromString(data);
				var affId = (xpath.select1("//author/@affiliationids", doc)!==undefined && xpath.select1("//author/@affiliationids", doc).nodeValue !== "" )  ? "affiliationids =\""+xpath.select1("//author/@affiliationids", doc).value +"\"" : '' ;
				var caffId = (xpath.select1("//author/@correspondingaffiliationid", doc)!==undefined && xpath.select1("//author/@correspondingaffiliationid", doc).nodeValue !== "" ) ?  "correspondingaffiliationid =\""+xpath.select1("//author/@correspondingaffiliationid", doc).value +"\"" : '';
				var id = (xpath.select1("//author/@id", doc)!==undefined && xpath.select1("//author/@id", doc).nodeValue !== "" ) ? "id =\""+xpath.select1("//author/@id", doc).value +"\"": '';
				var orcid = (xpath.select1("//author/@orcid", doc)!== undefined && xpath.select1("//author/@orcid", doc).nodeValue !== "") ? "orcid =\""+xpath.select1("//author/@orcid", doc).value +"\"": '';
				var preAffId =  (xpath.select1("//author/@presentaffiliationid", doc)!==undefined && xpath.select1("//author/@presentaffiliationid", doc).nodeValue !== "" ) ? "presentaffiliationid =\""+xpath.select1("//author/@presentaffiliationid", doc).value +"\"" : '';
				var onBehalfOfId = (xpath.select1("//author/@onbehalfofid", doc)!==undefined && xpath.select1("//author/@onbehalfofid", doc).nodeValue !== "" ) ? "onbehalfofid =\""+xpath.select1("//author/@onbehalfofid", doc).value +"\"" : '';
				var sapId = (xpath.select1("//author/@sapid", doc)!==undefined && xpath.select1("//author/@sapid", doc).nodeValue !== "" ) ? "sapid =\""+xpath.select1("//author/@sapid", doc).value +"\"" : '';
				var sprinRefId = (xpath.select1("//author/@springerreferenceid", doc)!==undefined && xpath.select1("//author/@springerreferenceid", doc).nodeValue !== "" ) ? "springerreferenceid =\""+xpath.select1("//author/@springerreferenceid", doc).value +"\"" : '';
				var equalcon = (xpath.select1("//author/@equalcontribution", doc)!==undefined && xpath.select1("//author/@equalcontribution", doc).nodeValue !== "" ) ? "equalcontribution =\""+xpath.select1("//author/@equalcontribution", doc).value +"\"" : '';
				var deceased = (xpath.select1("//author/@deceased", doc)!==undefined && xpath.select1("//author/@deceased", doc).nodeValue !== "" ) ? "deceased =\""+xpath.select1("//author/@deceased", doc).value +"\"" : '';
		
				var xml ="<author "+caffId+ " " +affId+ " " +id+ " " +orcid+ " " +preAffId+ " " +onBehalfOfId+ " " +sapId+ " " +sprinRefId+ " " +equalcon+ " " +deceased+">";
				//console.log('xml',xml);
				xml+= fun.getElement(doc,'author','authorname',['givenname', 'particle', 'familyname','suffix']);
				xml+= fun.getElement(doc,'author','contact',['phone', 'fax', 'email']);
				xml+='</author>';
				
				xml2js.parseString(xml, {explicitArray: true, explicitCharkey: true, trim: false, charkey: '#', emptyTag: { "#": '' },
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
			catch(error)
			{
				console.log(error);
				response.status(400).send({msg:"error"});
			}
		}
		else if(request.body.token=='jsontoxml')
		{
			console.log("Indu")
			try{
				var data = JSON.parse(request.body.content);
				['correspondingaffiliationid','affiliationids','id','orcid','presentaffiliationid','onbehalfofid','sapid','springerreferenceid','equalcontribution','deceased'].forEach(function(e)
				{
					if(data['author']['@'][e]!==undefined)
					{
						if (((data['author']['@'][e]).trim()).length === 0) 
						{
							delete data['author']['@'][e];
						}
					}
				});
				data['author']['authorname'].forEach(function(author)
				{
					if(author.givenname=== undefined)
						author["nogivenname"] = [{"#" : ""}];
				});
				['particle','suffix','phone','fax','email'].forEach(function(e)
				{
					var bibNode = (e === 'particle' || e === 'suffix') ? 'authorname' : 'contact';
					data = fun.removeEmptyElement(data,'author',bibNode,e);
				});
				console.log(JSON.stringify(data))
				var xml = js2xmlparser.parse('sample', data,{ useSelfClosingTagIfEmpty: false,format:{doubleQuotes:true},declaration: { include: false}});
				xml = xml.replace("\n",'');
				xml = xml.replace('<sample>','');
				xml = xml.replace('</sample>','');
				xml = xml.replace('<contact/>','<contact></contact>');
				xml = xml.replace(/<givenname><\/givenname>/,'<nogivenname> </nogivenname>');
				xml = fun.replaceTag(xml);
				response.status(200).send(xml.trim());
			}
			catch(error){
				console.log(error);
				response.status(400).send({msg:"error"});
			}
		}
		else 
		{
			response.status(400).send(JSON.stringify({'ErrorCode' : 'Unsupported request argument'}));
		}
	}
});
module.exports = author;