var mongoClient = require('mongodb').MongoClient,
	assert = require("assert");

var findResultDocs = function(db, callback) {
	var docs = [],
		filter = {},
		fields = {
			tpe:true,
			totals:true,
			timing:true,
		},
		cursor = db.collection('results').find(filter, fields);

	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc !== null) {
			docs.push(doc);
		} else {
			callback(docs);
		}
	});
};

var saveResultDoc = function(db, data, callback){
	var collection = db.collection('results');
	
	collection.insert(data, function (err, result){
		assert.equal(err, null);
		callback(result);
	});
};

module.exports = {
	save: function(req, res){
		var results_data = req.body;
			
		mongoClient.connect('mongodb://localhost:27017/calcwiz', function(err, db) {
			assert.equal(null, err);

			saveResultDoc(db, results_data, function(result){
				res.status(200).send('Results saved');
				db.close();
			});
		});
	},
	retrieve: function(req, res){
		var query = req.query;
		console.log(query);

		mongoClient.connect('mongodb://localhost:27017/calcwiz', function(err, db) {
			assert.equal(null, err);

			findResultDocs(db, function(docs) {
				res.status(200).send(docs);
				db.close();
			});
		});
	}
};