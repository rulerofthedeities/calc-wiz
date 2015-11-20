var express = require('express'),
	fs = require('fs'),
	bodyParser = require('body-parser'),
	app = express();

app.set('port', process.env.PORT || 3300);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/', function(request, response){
	response.sendFile(__dirname + '/public/calc.htm');
});


app.post('/saveconfig', function(req, res, next){
	var targetPath = './public/json/',
		fileName = decodeURI(req.query.file),
		json_data = JSON.stringify(req.body, null, 4);

	fs.writeFile(targetPath + fileName, json_data, function (err) {
		if (err){
			console.log(err.stack);
			res.status(500).send({ error: 'Error saving file!' });
		}
    	res.status(200).send('File saved');
	});
});


app.listen(app.get('port'), function(){
	console.log("Listening on port " + app.get('port'));
});
