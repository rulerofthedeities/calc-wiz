var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3300);
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response){
	response.sendFile(__dirname + '/public/calc.htm');
});




app.listen(app.get('port'), function(){
	console.log("Listening on port " + app.get('port'));
});
