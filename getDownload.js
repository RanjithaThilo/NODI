let getDownload = require('express').Router();
let glob = require('glob');
let path = require('path');
let jwtToken = require('./token.js');
let config = require('./config.json');
const { exec } = require('child_process');
let fs = require('fs');
getDownload.use(function timeLog (req, res, next) 
{
	console.log("Download Html load " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
getDownload.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});
getDownload.get('/', function (request, response,next)
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
				glob(filePath + '/*.html', {}, (err, files)=>
				{
					if(err) 
					{
						console.error(JSON.stringify(err));
						response.status(404).send(JSON.stringify(err));
						next();
					}
					else
					{
						try 
						{
							if (fs.existsSync(config.filePath+jNo+"/"+artNo+"/"+jNo+"_"+year+"_"+artNo+"_Article_CE.xml")) 
							{
								fs.unlinkSync(config.filePath+jNo+"/"+artNo+"/"+jNo+"_"+year+"_"+artNo+"_Article_CE.xml");
							}
							exec("perl /opt/se-portal-server/transformation/p2.pl /opt/edit_data/"+jNo+"/"+artNo+"/"+jNo+"_"+year+"_"+artNo+"_Article.html", (error, stdout, stderr) => 
							{
							  if (error) 
							  {
								console.error(`exec error: ${error}`);
								return;
							  }
							  console.log(`stdout: ${stdout}`);
							  console.log(`stderr: ${stderr}`);
							});
							response.status(200).send('Download Xml request received');
						} 
						catch(err) 
						{
						  console.error(err)
						  response.status(err.code).send(JSON.stringify(err));
						}						
						
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
module.exports = getDownload;