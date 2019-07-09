let sse = require('express').Router();
let glob = require('glob');
let path = require('path');
let jwtToken = require('./token.js');
let config = require('./config.json');

sse.use(function timeLog (req, res, next) 
{
	console.log("Download Html load " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
sse.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});
sse.get('/', function (request, response,next)
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
				glob(filePath + '/*_CE.xml', {}, (err, files)=>
				{
					console.log(files);
					if(err) 
					{
						console.error(JSON.stringify(err));
						response.status(404).send(JSON.stringify(err));
						next();
					}
					else if(files[0]==undefined)
					{
						console.error('File not found' + JSON.stringify(payLoad) + request.query.token);
						
						setTimeout(() => 
						{
							response.writeHead(200,{
								Connection: "keep-alive",
								"Content-Type":"text/event-stream",
								"Cache-Control":"no-cache"
							});
							response.write("data:" + "Specified File not Found");
							response.write("\n\n");
					  }, 500);
					}
					else
					{
						setTimeout(() => 
						{
							response.writeHead(200,{
							Connection: "keep-alive",
							"Content-Type":"text/event-stream",
							"Cache-Control":"no-cache"
							});
							response.write("data:" + "Specified File available");
							response.write("\n\n");
					  }, 500);
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
		response.json({ status: 404, msg: "error" });
	}
});
module.exports = sse;