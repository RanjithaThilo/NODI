let spell = require('express').Router();
let http = require('http');
let config = require('./config.json');

function getUnique(arr, comp) 
{
	const unique = arr
	.map(e => e[comp])
	.map((e, i, final) => final.indexOf(e) === i && i)
	.filter(e => arr[e]).map(e => arr[e]);
	return unique;
}

spell.use(function timeLog(request, res, next){
	console.log("spell Check " + request.method + " Request Received at " + Date.now() + "\n");
	next()
});
spell.get('/', function (request, response, next) 
{
	response.status(400).send(JSON.stringify({ 'error': 'get process cannot be done. please use post' }));
});
spell.post('/', function (request, response, next) 
{
	var responseString = '';
	http.get(config.spellServer+'?text='+encodeURIComponent(request.body.text)+'&language=en-US&disabledRules=EN_QUOTES,TRUE_TO_WORD&enabledOnly=false', (resp) => 
	{
		resp.setEncoding('utf8');
		resp.on("data", function (data) 
		{
			responseString += data;
		});
		resp.on("end", () => 
		{
			var json = JSON.parse(responseString).matches;
			var sug = [];
			json.forEach(function(e)
			{
				if(e.replacements.length <4 && e.replacements.length!=0)
				{
					var suggestions = '';
					var offSet = '';
					var length = '';
					var errorWord = request.body.text.substring(e.offset,(e.offset+e.length));
					e.replacements.forEach(function(ele)
					{
						suggestions += (ele.value)+",";
					})
					suggestions = suggestions.substring(0,suggestions.length-1)
					sug.push({findWord:errorWord,suggestions:suggestions});
				}
			});
			sug = (getUnique(sug,'findWord'));
			response.status(200).send(sug);
		});
	}).on('error', (err) => 
	{
		console.error("problem with request: " + err);
		response.status(400).send(JSON.stringify(err));
	}).end();
});
module.exports = spell;