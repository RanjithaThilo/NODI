let getToken = require('express').Router();
let jwtToken = require('./token.js');

getToken.use(function timeLog (req, res, next) 
{
	console.log("Token " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
getToken.post('/', function (req, res, next)
{
	res.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});

getToken.get('/', function (req, res) 
{
	res.status(200).send(jwtToken.getEncrypt(req.query));
});
module.exports = getToken;