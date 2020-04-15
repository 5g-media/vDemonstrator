var express = require('express');
var speech = require('../speech.js');
var router = express.Router();

var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
	request(speech.service.url + '/api/configuration/all', { json: true }, function(err, res0, config) {
		request(speech.service.url + '/api/statistics', { json: true }, function(err, res1, stats) {
			res.render('index', {
				title: 'UC2 DEMO',
				year: (new Date()).getFullYear(),
				stats: stats || null,
				config: Object.assign(config || {}, speech)
			});
		});
	});
});

module.exports = router;
