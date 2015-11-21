var fs = require('fs'),
	mongoClient = require('mongodb').MongoClient;

module.exports.initialize = function(app, router) {

	router.route('/config')
	.post(function(req, res, next){
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

	router.route('/results')
	.post(function(req, res){
		var results_data = req.body;
		mongoClient.connect('mongodb://localhost:27017/calcwiz',
		function(err, db) {
			if (err){
				console.log(err.stack);
				res.status(500).send({ error: 'Error connecting to db!' });
			}
			var collection = db.collection('results');
			collection.insert(results_data, function (err, result){
				if (err){
					console.log(err.stack);
					res.status(500).send({ error: 'Error saving results!' });
				}
				db.close();
				res.status(200).send('Results saved');
			});
		});
	})
	.get(function(req, res){
		
	});

	app.use(router);
};