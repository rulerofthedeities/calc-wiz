var mongo = require('mongodb'),
	assert = require("assert");

var findResultDocs = function(db, filter, callback) {
	var docs = [],
		fields = {
			_id:false,
			tpe:true,
			totals:true,
			timing:true,
			questions:true,
			user:true
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
		
		saveResultDoc(mongo.DB, results_data, function(result){
			res.status(200).send('Results saved');
		});
	},
	retrieve: function(req, res){
		var query = req.query,
			filter = {};

		if (query.completed == 'true'){
			filter["timing.interrupted"] = false;
		}
		filter["user.name"] = query.user;
		findResultDocs(mongo.DB, filter, function(docs) {
			res.status(200).send(docs);
		});
	}
};