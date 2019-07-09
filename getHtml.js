let getHtml = require('express').Router();
let glob = require('glob');
let path = require('path');
let jwtToken = require('./token.js');
let config = require('./config.json');

getHtml.use(function timeLog (req, res, next) 
{
	console.log("Initial Html load " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
getHtml.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});
getHtml.get('/', function (request, response,next)
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
			console.log(payLoad);
			if(payLoad!=0)
			{
				var filePath = config.filePath+payLoad[0].journal_no+"/"+payLoad[0].art_no+"/";
				glob(filePath + '/*.html', {}, (err, files)=>
				{
					if(err) 
					{
						console.error(JSON.stringify(err));
						response.status(404).send(JSON.stringify(err));
						next();
					}
					else if(files[0]==undefined)
					{
						console.error('File not found' + JSON.stringify(payLoad) + request.query.token);
						response.status(404).json({Error:'Specified File not Found'});
					}
					else
					{
						response.download(files[0], path.basename(files[0]), function(err)
						{
							if (err) 
							{
								console.error("problem with request: " + err);
								response.send(JSON.stringify(err));
							}
						});
					}
				});
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
		response.status(400).send({ msg: "Please check the token provided" });
	}
});
module.exports = getHtml;