let listesm = require('express').Router();
let jwtToken = require('./token.js');
let config = require('./config.json');
const fs = require('fs');
const path = require('path');

listesm.use(function timeLog(req, res, next) {
    console.log("Initial Html load " + req.method + " Request Received at " + Date.now() + "\n");
    next()
});
listesm.post('/', function (request, response, next) {
    response.status(400).send(JSON.stringify({ 'error': 'Post process cannot be done. please use get' }));
});

listesm.get('/', function (request, response, next) {
    try {
        if (request.query.token == '' || request.query.token == undefined) {
            response.status(400).send(JSON.stringify({ 'error': 'Invalid or empty Token' }));
        }
        else {
            payLoad = jwtToken.getCyper(request.query.token);
            console.log('payLoad',payLoad);
            if (payLoad != 0) {
                //var filePath = config.filePath+payLoad[0].journal_no+"/"+payLoad[0].art_no+"/pre";
                var filePath = config.filePath + payLoad[0].journal_no + "/" + payLoad[0].art_no + "/";
                const files = fs.readdirSync(filePath, 'utf8');
                const fileres = [];
                for (let file of files) {
                    const extension = path.extname(file).substr(1)
                   const fileSizeInBytes = fs.statSync(path.join(filePath, file)).size;
                   var fileSizeInKilobytes = (fileSizeInBytes / 1024).toFixed(1) ;
                    fileres.push({ name: file, extension, fileSizeInKilobytes });
                }
                response.status(200).send(fileres);
            }
            else {
                response.status(400).send(JSON.stringify({ 'error': 'unable to parse token' }));
            }
        }
    }
    catch (error) {
        console.log(error);
        response.status(400).send({ msg: "Please check the token provided" });
    }
});
module.exports = listesm;