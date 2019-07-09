let serveImage = require('express').Router();
let path = require('path');
let jwtToken = require('./token.js');
let exp = require('express');
serveImage.all('/:token/:fileName', function (request, response)
{
	var payLoad = jwtToken.getCyper(request.params.token)
	console.log(payLoad)
	response.sendFile(__dirname+'\\ce_tool\\'+payLoad[0].journal_no+'\\'+payLoad[0].art_no+'\\'+request.params.fileName)
});
module.exports = serveImage;