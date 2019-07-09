let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let config = require('./config.json');
let port = config.port;
let affiliation = require("./affiliation");
let author = require("./author");
let reference = require("./reference");
let reference1 = require("./reference1");
let getHtml = require("./getHtml");
let getMath = require("./getMath");
let getQueries = require("./getQueries");
let getToken = require("./getToken");
//let specialCharacter = require("./getSpecialCharacter");
let saveHtml = require("./saveHtml");
let xslt = require("./xslt");
let serveImage = require("./serveImage");
let getDownload = require("./getDownload");
let listesm = require("./listesm");
//let updatedReference = require('./referenceupdate');
let updatedReference = require('./referencecli');
let sse = require("./sse");
let spell = require("./spell");
let getXml = require("./getXml");




app.use(bodyParser.urlencoded({extended: true,limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb', extended: true}));

app.use(function(req, res, next) 
{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(function (err, req, res, next) 
{
    console.error(err.stack)
    res.status(500).send('Something broke!')
});
app.use(bodyParser.json());
app.all('/', (req, res) => res.send('Welcom to the services. No exact details are provided'));

app.use('/affiliation', affiliation);
app.use('/author', author);
app.use('/reference', reference);
app.use('/reference1', reference1);
app.use('/getHtml', getHtml);
app.use('/getMath', getMath);
app.use('/getQueries', getQueries);
app.use('/getToken', getToken);
app.use('/saveHtml', saveHtml);
//app.use('/special-character', specialCharacter);
app.use('/xslt', xslt);
app.use('/serveImage', serveImage);
app.use('/getDownload', getDownload);
app.use('/listesm',listesm);
app.use('/updatedreference',updatedReference);
app.use('/sse', sse);
app.use('/getXml', getXml);
app.use('/spell', spell);

var server = app.listen(port, function () 
{
    console.log("Running RestApi on port " + port);
});
server.on('connection', function(socket) 
{
	socket.setTimeout(1 * 45 * 1000);
	socket.once('timeout', function() 
	{
		console.log("Time Out");
		process.nextTick(() => 
		{
			socket.end;
			console.log('nextTick callback');
		});
	});
});