let getXml = require('express').Router();
let glob = require('glob');
let path = require('path');
let jwtToken = require('./token.js');
let config = require('./config.json');

getXml.use(function timeLog (req, res, next) 
{
	console.log("Download xml " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
getXml.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});
getXml.get('/', function (request, response,next)
{
	try 
	{
		if(request.query.token=='' || request.query.token==undefined)
		{
			response.status(400).send(JSON.stringify({'error':'Invalid or empty Token'}));
		}
		else
		{
			payLoad = jwtToken.getCyper(request.query.token)
			if(payLoad!=0)
			{
				var filePath = config.filePath+payLoad[0].journal_no+"/"+payLoad[0].art_no+"/";
				var jNo = payLoad[0].journal_no;
				var artNo = payLoad[0].art_no;
				var year = new Date().getFullYear();
				let file = filePath+jNo+"_"+year+"_"+artNo+"_Article_CE.xml";
				response.download(file, path.basename(file), function(err)
				{
					if (err) 
					{
						console.error("problem with request: " + err);
						response.send(JSON.stringify(err));
					}
				})
			}
			else
			{
				response.status(400).send(JSON.stringify({'error':'unable to parse token'}));
			}
		}
	}
	catch (error) 
	{
		console.log(error);
		response.json({ status: 404, msg: "error" });
	}
});
module.exports = getXml;