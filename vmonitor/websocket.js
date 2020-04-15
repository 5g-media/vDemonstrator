var io = require('socket.io')();

exports.initialize = function (server) {

	io.attach(server);

	io.on('connection', function(socket){
		console.log('a user connected');
		socket.on('disconnect', function(){
			console.log('user disconnected');
		});
	});

};

exports.emit = function (msg) {
	io.emit('stt conversion', msg);
};