var express = require('express');
var speech = require('../speech.js');
var router = express.Router();

var request = require('request');

router.get('/', function(req, res) {
	request(speech.service.url + '/api/', { json: true }, function(err, res1, body) {
		res.json(body);
	});
});
router.get('/transcription', function(req, res) {
	request(speech.service.url + '/api/transcription', { json: true }, function(err, res1, body) {
		res.json(body);
	});
});
router.post('/transcription/start', function(req, res) {
	request({method: 'POST', url: speech.service.url + '/api/transcription/start', json: true}, function(err, res1, body) {
		res.json(body);
	});
});
router.post('/transcription/stop', function(req, res) {
	request({method: 'POST', url: speech.service.url + '/api/transcription/stop', json: true}, function(err, res1, body) {
		res.json(body);
	});
});
router.get('/transcription/state', function(req, res) {
	request(speech.service.url + '/api/transcription/state', { json: true }, function(err, res1, body) {
		res.json(body);
	});
});
router.get('/words', function(req, res) {
	request(speech.service.url + '/api/words', { json: true }, function(err, res1, body) {
		res.json(body);
	});
});
router.get('/statistics', function(req, res) {
	request(speech.service.url + '/api/statistics', { json: true }, function(err, res1, body) {
		res.json(body);
	});
});
router.get('/configuration', function(req, res) {
	request(speech.service.url + '/api/configuration', { json: true }, function(err, res1, body) {
		res.json(Object.assign({}, speech, body));
	});
});
router.get('/configuration/all', function(req, res) {
	request(speech.service.url + '/api/configuration/all', { json: true }, function(err, res1, body) {
		res.json(Object.assign({}, speech, body));
	});
});
router.post('/configuration', function(req, res) {
	var data = req.body;
	speech.service.host = data.host || speech.service.host;
	speech.service.port = data.port || speech.service.port;
	request({method: 'POST', url: speech.service.url + '/api/configuration', body: data, json: true}, function(err, res1, body) {
		res.json(Object.assign({}, speech, body));
	});
});
router.post('/process/exit', function(req, res) {
	var data = req.body;
	if (data.relay) {
		request({method: 'POST', url: speech.service.url + '/api/process/exit', body: data, json: true}, function(err, res1, body) {
			res.json(Object.assign({}, {relay: true}, body));
		});
	}
	else {
		res.json({exit: true});
		process.exit(1);
	}
});

module.exports = router;