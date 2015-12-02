var config = require('../server/controllers/config'),
	results = require('../server/controllers/results');

module.exports.initialize = function(app, router) {

	router.post('/config', config.save);
	router.get('/config', config.load);
	router.post('/results', results.save);
	router.get('/results', results.retrieve);

	app.use(router);
};