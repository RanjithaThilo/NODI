let routerXslt = require('express').Router();
let jwt = require('jws');
let fs =require('fs');
let jwtToken = require('./token.js');
var parseString = require('xml2js').parseString;
var http = require('http');
var base64data = '',decodedtxt = '';
let config = require('./config.json');
let glob = require('glob');
let path = require('path');

routerXslt.use(function timeLog (req, res, next) 
{
	console.log("XSLT " + req.method + " Request Received at "+Date.now().toString() + "\n");
	next()
});
routerXslt.get('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'get process cannot be done. please use Post'}));
});
routerXslt.post('/', function (request, response,next) 
{
	try 
	{
		
		payLoad = jwtToken.getCyper(request.body.token);
		if(payLoad!=0)
		{
			var responseString = '';
			var filePath = config.filePath+payLoad[0].journal_no+"/"+payLoad[0].art_no+"/";
			glob(filePath + '/*.html', {}, (err, files)=>
			{
				if(err) 
				{
					console.error(JSON.stringify(err));
					response.status(e.errno).send(JSON.stringify(e.Error));
					next();
				}
				else if(files[0]==undefined)
				{
					console.error('File not found' + JSON.stringify(payLoad) + request.body.token);
					response.status(404).json({Error:'Specified File not Found'});
				}
				else
				{
					fs.readFile(files[0], function(err, data)
					{
						if(err)
						{
							console.log('Unable to Read the file'+JSON.stringify(e));
							response.status(400).send(JSON.stringify(err));
							next();
						}
						else
						{
							let base64data = Buffer.alloc(data.length,data).toString('base64');
							//fs.writeFileSync('encode.txt',base64data)
							var options = 
							{
								host: config.xsltServer,port:config.xsltServerPort,path: config.xsltPath,method: 'POST',
								headers:{'content-length': Buffer.byteLength(base64data),'content-type': 'application/octet-stream','accept': '*/*'}
							};
							req = http.request(options, (res) => 
							{
								res.setEncoding('utf8');
								res.on("data", function (data) 
								{
									responseString += data;
								});
								res.on("end", function () 
								{
									var decodedtxt = Buffer.from(responseString,'base64').toString('utf8');
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
											fs.writeFile(files[0],decodedtxt,function(err)
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
														if (err) 
														{
															console.error("problem with request: " + err);
															response.send(JSON.stringify(err));
														}
													});
												}
											});
										}										
									});									
								});
							});
							req.on('error', (e) => 
							{
								console.error("problem with request: " + e);
								response.status(e.errno).send(JSON.stringify(e.Error));
							});
							req.write(base64data);
							req.end();
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
	catch (e) 
	{
      response.status(400).send(JSON.stringify(e));
    }
});
module.exports = routerXslt;