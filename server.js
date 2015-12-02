var express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	routes = require('./server/routes'),
	dbConnection = require('./server/dbconnection');

app.set('port', process.env.PORT || 3300);
app.set('defaultConfig', __dirname + '/public/json/default.config.json');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());

app.get('/', function(request, response){
	response.sendFile(__dirname + '/public/calc.htm');
});

routes.initialize(app, new express.Router());

dbConnection.connect(function(){
	app.listen(app.get('port'), function(){
		console.log("Listening on port " + app.get('port'));
	});
});
