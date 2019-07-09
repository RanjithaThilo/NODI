let routerDoc = require('express').Router();
let fs =require('fs');
let glob = require('glob');
let path = require('path');
let jwtToken = require('./token.js');
let config = require('./config.json');

function sendError(err,response)
{
	console.error("problem with request: " + err);
	response.status(400).send(JSON.stringify(err));
}
routerDoc.use(function timeLog (request, response, next) 
{
	console.log("Save Html " + request.method + " Request Received at "+Date.now() + "\n");
	next()
});
routerDoc.get('/', function (request, response,next)
{
	response.status(400).send(JSON.stringify({'error':'Get process cannot be done. please use Post'}));
});

routerDoc.post('/', function (request, response,next)
{
	try 
	{
		if(request.body.token==undefined || request.body.token =='')
		{
			response.send(JSON.stringify({'error':'Unable to find the token value. please check'}));
		}
		if(request.body.Htmlchar==undefined || request.body.Htmlchar =='')
		{
			response.send(JSON.stringify({'error':'Unable to find the content to save. please check'}));
		}
		payLoad = jwtToken.getCyper(request.body.token);
		if(payLoad!=0)
		{
			
			var contenttoSave =  request.body.Htmlchar;
			contenttoSave = contenttoSave.replace(/<img([^>]+)>/gi,'<img$1/>');
			contenttoSave = contenttoSave.replace(/<img([^>]+)>.{0,}<\/img>/gi,'<img$1/>');
			contenttoSave = contenttoSave.replace(/&nbsp;/gi,' ');
			token = '',artNo = '',journalNo = '';
			var filePath = config.filePath+payLoad[0].journal_no+"/"+payLoad[0].art_no+"/";
			glob(filePath + '/*.html', {}, (err, files)=>
			{
				fs.rename(files[0], files[0]+'.'+new Date().getTime()+'.bak', function(err)
				{
					if(err) 
					{
						console.error(err);
						sendError(err,response);
						next();
					}
					else
					{
						fs.writeFile(files[0],contenttoSave,function(err)
						{
							if (err) 
							{
								console.error(JSON.stringify(err));
								response.status(400).send(JSON.stringify(err));
								next();								
							}
							else
							{
								response.download(files[0], path.basename(files[0]), function(err)
								{
									if (err) {
										console.error(err);
										sendError(err,response);
										next();
									}
								});
							}
						});
					}
				});
			});
		}
		else
		{
			response.status(400).send(JSON.stringify({'error':'unable to parse token'}));
		}	
	}
	catch (e) 
	{
      response.status(400).send(JSON.stringify(e));
    }
});
module.exports = routerDoc;