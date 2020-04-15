var spawn = require('child_process').spawn;
var request = require('request');
var io = require('socket.io-client');
var ws = require('./websocket');

var cmd = {
	data: 1,
	error: 2,
	debug: 3,
	status: 4,
	config: 5
};
var restartTime = 1000;
var port = process.env.SPEECH_PORT || 3000;
var host = process.env.SPEECH_HOST || 'localhost';
var url = 'http://' + host + ':' + port;

var socket = io(url);

socket.on('stt conversion', function(data){
	if (!data) return;
	ws.emit(data);
	switch (data.cmd) {
		case cmd.config:
			FFMpeg.restart();
			break;
	}
});

var Nmc = {
	spawn: function () {
		spawn('node', ['./nmc.js'], {
			stdio: 'inherit'
		});
	}
};

var FFMpeg = {
	timer: null,
	process: null,
	restart: function () {
		if (!FFMpeg.timer) {
			FFMpeg.timer = setTimeout(function () {
				request(url + '/api/configuration', { json: true }, function(err, res0, config) {
					if(err) return console.log(err);
					FFMpeg.spawn(config.url);
					FFMpeg.timer = null;
				});
			},restartTime);
		}
	},
	spawn: function (stream) {
		var cmd = 'ffmpeg';
		var	args = [
				'-loglevel', 'warning',
				'-i', stream,
				'-c', 'copy',
				'-f', 'flv',
				'rtmp://localhost/live/stream'
		];
		var opts = {stdio : ['ignore', 'pipe', 'pipe']};
		FFMpeg.process = spawn(cmd, args, opts)
			.on('close', function () {
				console.log('[FFMpeg Close]');
				FFMpeg.restart();
			});
		FFMpeg.process.stdio[2].on('data', function(data) {
			// if a warning appears, restart ffmpeg
			//console.log(data.toString());
			console.log('[FFMpeg Error]');
			FFMpeg.process.kill();
		});
	}
};

exports.start = function () {
	request(url + '/api/configuration', { json: true }, function(err, res0, config) {
		if(err) return console.log(err);
		Nmc.spawn();
		FFMpeg.spawn(config.url);
	});
};