let routerSpecialCharacher = require('express').Router();
let config = require('./spclchar');

routerSpecialCharacher.use(function timeLog (request, res, next) 
{
	console.log("SpecialCharacher " + request.method + " Request Received at "+Date.now() + "\n");
	next()
});
routerSpecialCharacher.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});

routerSpecialCharacher.get('/', function (req, response)
{
	try
	{
		if(config)
		{
			response.send(JSON.stringify(config));
		}		
	}catch(error){
        console.log(error);
        response.json({status:404,msg:"error"});
	}
});
module.exports = routerSpecialCharacher;