let updatedReference = require('express').Router();
var xmlescape = require('xml-escape');
var decode = require('unescape');
let xml2js = require('xml2js');
let fun = require('./functions.js');
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
var xmlserializer = require('xmlserializer');


updatedReference.post('/',function(req,res,err){
    if(req.body.token == 'xmltojson'){
        try {
            var data = req.body.content;
            var doc = new dom().parseFromString(data);
            var parseString = xml2js.parseString;
			parseString(doc, {
				explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
				attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
				valueProcesser: [fun.replaceTag], explicitRoot: true
			}, (err, response) => {
				if (err) {
					console.log(err);
					res.status(100).send(JSON.stringify(err));
				}
				console.log('res', JSON.stringify(res));
				res.status(200).send(JSON.stringify(res));
			});
        }catch (err) {
			console.log(err)
			res.status(err.errno).send(JSON.stringify(err.Error));
		}
    }
})
//https://stackoverflow.com/questions/14340894/create-xml-in-javascript


module.exports = updatedReference;