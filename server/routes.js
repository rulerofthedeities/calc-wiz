var config = require('../server/controllers/config.js'),
	results = require('../server/controllers/results.js');

module.exports.initialize = function(app, router) {

	router.post('/config', config.save);
	router.post('/results', results.save);
	router.get('/results', results.retrieve);

	app.use(router);
};