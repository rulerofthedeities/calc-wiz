var mongo = require('mongodb'),
	assert = require("assert"),
	fs = require('fs');


var loadConfigFile = function(fileName, callback){
	fs.readFile(fileName, function (err, response) {
		assert.equal(null, err);
		callback(JSON.parse(response.toString()));
	});
};

var findConfigDoc = function(db, filter, callback){
	db.collection('config').find(filter, {'settings': true, '_id':false}).limit(1).next(function(err, doc) {
		assert.equal(null, err);
		callback(doc);
    });
};

var upsertConfigDoc = function(db, data){
	db.collection('config').updateOne(
		{"name": data.userName}, 
		{$set:{ "settings": data.settings}},
		{upsert: true},
		function(err, r){
			assert.equal(null, err);
		}
	);

};

module.exports = {
	save: function(req, res){
		var data = req.body;
		upsertConfigDoc(mongo.DB, data);
		res.status(200).send(data.settings);
	},
	load: function(req, res){
		var userName = decodeURI(req.query.usr),
			filter = {"name": userName};

		findConfigDoc(mongo.DB, filter, function(doc) {
			if (doc){
				//Config settings found in db
				res.status(200).send(doc.settings);
			} else {
				//No config settings found in db, load from default config file
				console.log('Config for user ' + userName + ' not found, loading from default file');
				var conf = req.app.get('defaultConfig');
				loadConfigFile(conf, function(settings){
					upsertConfigDoc(mongo.DB, {"userName": userName, "settings": settings});
					res.status(201).send(settings);
				});
			}
		});

	}
};