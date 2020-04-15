var service = {
	host: null,
	port: null,
	url: null
};
var _host = null;
var _port = null;
var _url = null;

Object.defineProperty(service, 'host', {
	get : function () {
		return _host;
	},
	set : function (val) {
		_host = val;
		_url = 'http://' + _host + ':' + _port;
	}
});

Object.defineProperty(service, 'port', {
	get : function () {
		return _port;
	},
	set : function (val) {
		_port = val;
		_url = 'http://' + _host + ':' + _port;
	}
});

Object.defineProperty(service, 'url', {
	get : function () {
		return _url;
	},
	writeable: false
});

service.host = process.env.SPEECH_HOST || 'localhost';
service.port = process.env.SPEECH_PORT || 3000;
service.url = 'http://' + service.host + ':' + service.port;

exports.service = service;