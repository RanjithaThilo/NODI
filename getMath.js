let getMath = require('express').Router();
let fs =require('fs');
let config = require('./config.json');
let xml2js = require('xml2js');
let { parseString } = require('xml2js')

getMath.use(function timeLog (req, res, next) 
{
	console.log("Math " + req.method + " Request Received at "+Date.now() + "\n");
	next()
});
getMath.post('/', function (request, response, next)
{
	response.status(400).send(JSON.stringify({'error':'Post process cannot be done. please use get'}));
});

getMath.get('/', function (req, response) 
{
	var xml = fs.readFileSync('math.xml');
	var parseString = xml2js.parseString;
	parseString(xml,{explicitArray:false,explicitCharkey:false,trim :true,
	attrkey : '@',preserveChildrenOrder:true,explicitRoot:true},(err, res)=>
	{
		if(err)
			console.log(err);
		var jsonMath = [];
		var jsonGk = [];
		var jsonArrows = [];
		var jsonLogic = [];
		var jsonSymbol = [];
		var jsonFormat = [];
		for(var i=0;i<res.xml.math.image.length;i++)
		{
			jsonMath.push({'file':res.xml.math.image[i].command,'src' :config.imageServerPath+":"+config.port+'/'+res.xml.math.image[i].src+".png"});
		}
		for(var i=0;i<res.xml.gkfun.image.length;i++)
		{
			jsonGk.push({'file':res.xml.gkfun.image[i].command,'src' :config.imageServerPath+":"+config.port+'/'+res.xml.gkfun.image[i].src+".png"});
		}
		for(var i=0;i<res.xml.arrows.image.length;i++)
		{
			jsonArrows.push({'file':res.xml.arrows.image[i].command,'src' :config.imageServerPath+":"+config.port+'/'+res.xml.arrows.image[i].src+".png"});
		}
		for(var i=0;i<res.xml.logic.image.length;i++)
		{
			jsonLogic.push({'file':res.xml.logic.image[i].command,'src' :config.imageServerPath+":"+config.port+'/'+res.xml.logic.image[i].src+".png"});
		}
		for(var i=0;i<res.xml.symbols.image.length;i++)
		{
			jsonSymbol.push({'file':res.xml.symbols.image[i].command,'src' :config.imageServerPath+":"+config.port+'/'+res.xml.symbols.image[i].src+".png"});
		}
		for(var i=0;i<res.xml.format.image.length;i++)
		{
			var testCondition = res.xml.format.image[i].src;
			if(testCondition=='TrueType' ||  testCondition=='Bold' || testCondition=='Italic' || testCondition=='tiny' || testCondition=='script' || testCondition=='small' || testCondition=='normal' || testCondition=='large' || testCondition=='huge')
			{
				var src = '\\'+res.xml.format.image[i].command+" ";
				var file = res.xml.format.image[i].src;
			}
			else
			{
				var src = '\\color{'+res.xml.format.image[i].command+'} ';
				var file = res.xml.format.image[i].command;
			}
			
			jsonFormat.push({'file':file,'src' :src});
		}
		var myMaths = 
		{
			"getQuery": 
			{
				"MATHS" : jsonMath,"GKFN" : jsonGk,"ARROW" : jsonArrows,
				"LOGIC" : jsonLogic,"SYMBOL" : jsonSymbol,"FORMAT" : jsonFormat
			}
		}
		response.status(200).send(JSON.stringify(myMaths));
		//response.status(200).send(JSON.stringify(res));
	});
});
module.exports = getMath;