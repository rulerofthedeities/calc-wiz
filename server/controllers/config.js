var fs = require('fs');

module.exports = {
	save: function(req, res){
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
	}
};