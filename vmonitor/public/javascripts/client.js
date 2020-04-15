'use strict';

/*
* Animation
*/
$.fn.extend({
	animateCss: function(animationName, callback) {
		var animationEnd = (function(el) {
			var animations = {
				animation: 'animationend',
				OAnimation: 'oAnimationEnd',
				MozAnimation: 'mozAnimationEnd',
				WebkitAnimation: 'webkitAnimationEnd'
			};

			for (var t in animations) {
				if (el.style[t] !== undefined) {
					return animations[t];
				}
			}
		})(document.createElement('div'));

		this.addClass('animated ' + animationName).one(animationEnd, function() {
			$(this).removeClass('animated ' + animationName);

			if (typeof callback === 'function') callback();
		});

		return this;
	}
});



/*
* Settings
*/
var config = {
	url: null,
	language: null,
	validity: null,
	credentials: null
};
var $transcription = $('#rt-tab');
var $form = $('#formSettings');
var $cancel = $('#buttonCancel');
var $save = $('#buttonSave');
var $host = $('#inputSpeechHost');
var $port = $('#inputSpeechPort');
var $url = $('#inputStream');
var $lang = $('#footerLang');
var $language = $('#selectLanguage');
var $validity = $('#selectValidity');
var $credentials = $('#fileCredentials');
var handleSaveButton = function () {
	$save
		.text('Saved')
		.removeClass('btn-danger')
		.addClass('btn-success')
		.animateCss('bounceIn', function () {
			$transcription.trigger('click');
			setTimeout(function () {
				$save
					.text('Save')
					.addClass('btn-danger')
					.removeClass('btn-success');
				}, 500);
		});
};
var handleCancelButton = function () {
	$cancel.animateCss('bounceIn', function () {
		$transcription.trigger('click');
	});
};
var refreshSettings = function (data) {
	if (data) {
		if (data.service) {
			$host.val(data.service.host);
			$port.val(data.service.port);
		}
		$url.val(data.url);
		$language.val(data.language);
		onChangeSelected.apply($language.get(0));
		$validity.val(data.validity);
		onChangeSelected.apply($validity.get(0));
		$lang.text($language.find('option:selected').text());
	}
	else {
		$.get('/api/configuration', refreshSettings, 'json');
	}
};
var resetConfig = function () {
	config = {
		host: null,
		port: null,
		url: null,
		language: null,
		validity: null,
		credentials: null
	};
};
var resetForm = function () {
	$form.get(0).reset()
};
var resetStatistics = function () {
	$stt.empty();
	$words.html('0');
	$confidence.html('0');
	$timeline.empty();
	$wordcloud.empty();
};
var saveSettings = function () {
	$.post('/api/configuration', config, function (data) {
		if (SPEECH_HOST !== config.host || SPEECH_PORT !== config.port) {
			SPEECH_HOST = config.host;
			SPEECH_PORT = config.port;
			return location.reload(true);
		}
		resetForm();
		resetConfig();
		refreshSettings(data);
	}, 'json');
	handleSaveButton();
};
var onChangeSelected = function () {
	var $this = $(this);
	var val = $(this).val();
	$this.find('option').removeAttr('selected');
	$this.find('option[value=' + val + ']').attr('selected', 'selected');
};
var onCredentialsLoad = function (event){
	config.credentials = JSON.parse(event.target.result);
};
$form.submit(function (e) {
	e.preventDefault();
	config.host = $host.val();
	config.port = $port.val();
	config.url = $url.val();
	config.language = $language.val();
	config.validity = $validity.val();
	if (transcribing === state.timeout) {
		resetStatistics();
	}
	saveSettings();
});
$cancel.click(function (e) {
	e.preventDefault();
	handleCancelButton();
});
$language.on('change', onChangeSelected);
$validity.on('change', onChangeSelected);
$credentials.on('change', function () {
	var reader = new FileReader();
	reader.onload = onCredentialsLoad;
	reader.readAsText($credentials.get(0).files[0]);
});



/*
* Cummunication
*/
var socket = io('http://' + location.hostname + ':9000');
var cmd = {
	data: 1,
	error: 2,
	debug: 3,
	status: 4,
	config: 5
};
var state = {
	stop: 1,
	start: 2,
	started: 3,
	stopped: 4,
	timeout: 5,
	restart: 6
};
var $stt = $('<span class="livestream-text"></span>');
var $stw = $('<div class="livestream-subtitle"></div>').append($stt);
var $breadcrumb = $('.breadcrumb .breadcrumb-item.active');
var $words = $('#footerWords');
var $timeline = $('#timebar');
var $confidence = $('#footerConfidence');
var $transcript = $('#buttonTranscript');
var $wordcloud = $('#wordcloud');
var transcribing = state.stopped;
var wCache = [];
var createWordCloud = function () {
	var selector = '#' + $wordcloud.attr('id');
	var tWord = _.sortBy(_.map(_.countBy(wCache, function(word) {
		return word.word + '!'; // underscore issue, thus add any char and remove in 2nd iteration
	}), function (val, key) {
		return {text: key.slice(0,-1), size: val / wCache.length * 100};
	}), function (val) {
		return val.size;
	});
	$wordcloud.empty();
	d3.wordcloud()
		.size([800, 400])
		.font('Impact')
		.scale('log')
		.spiral('rectangular')
		.selector(selector)
		.words(tWord.reverse())
		.start();
};
var iconOnElement = '<i class="far fa-dot-circle"></i>';
var iconOffElement = '<i class="far fa-stop-circle"></i>';
var iconLockElement = '<i class="fas fa-lock"></i>';
var transcriptAnimate = function () {
	$transcript.animateCss('bounceIn', function () {
		$transcript.removeClass('bounceIn');
	});
};
var getUrlParameter = function (name) {
	name = name.replace(/[\[]/, '\\[' ).replace( /[\]]/, '\\]');
	var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	var results = regex.exec(location.search);
	return results === null ? 0 : parseInt(decodeURIComponent(results[ 1 ].replace( /\+/g, ' ' )));
};
var delay = getUrlParameter('del');
var transcription = '';
var transcriptOnStart = function () {
	$transcript.html(iconOffElement + 'Transcription starting...');
	$transcript.removeClass().addClass('btn btn-lg btn-warning').attr('disabled', true);
};
var transcriptOnStop = function () {
	$transcript.html(iconOnElement + 'Transcription stopping...');
	$transcript.removeClass().addClass('btn btn-lg btn-warning').attr('disabled', true);
};
var transcriptOnStarted = function () {
	$transcript.html(iconOffElement + 'Stop Transcription');
	$transcript.removeClass().addClass('btn btn-lg btn-danger').removeAttr('disabled');
};
var transcriptOnStopped = function () {
	$transcript.html(iconOnElement + 'Start Transcription');
	$transcript.removeClass().addClass('btn btn-lg btn-dark').removeAttr('disabled');
};
var transcriptOnTimeout = function () {
	$transcript.html(iconLockElement + 'Session expired');
	$transcript.removeClass().addClass('btn btn-lg btn-dark').attr('disabled', true);
	transcriptAnimate();
};
var transcriptOnRestart = function () {
	transcriptOnStarted();
};
var handleData = function (msg) {
	transcription = msg.transcript.split(' ').slice(-15).join(' ');
	setTimeout(function () {
		$stt.html(transcription);
	}, delay);
	if (msg.words.length>0) {
		wCache = wCache.concat(msg.words);
		$words.html(msg.wordCount);
		$confidence.html(msg.confidence);
		$timeline.append(msg.words.map(function (t) {
			return '<li class="timeline-item">\n' +
				'<div class="timeline-badge primary"><i class="fas fa-font"></i></div>\n' +
				'<div class="timeline-panel">\n' +
				'<div class="timeline-heading">\n' +
				'<h6 class="timeline-title"><samp>' + t.word + '</samp></h6>\n' +
				'<p><small class="text-muted"><i class="far fa-clock"></i> ' + (new Date(Date.now()+parseInt(t.startTime.seconds))).toISOString() + '</small></p>\n' +
				'</div>\n' +
				'</div>\n' +
				'</li>\n'
		}).join('') + '\n');
		createWordCloud();
		$('.info.info-one').remove();
	}
};
var handleState = function () {
	switch (transcribing) {
		case state.stop:
			transcriptOnStop();
			break;
		case state.start:
			transcriptOnStart();
			break;
		case state.started:
			transcriptOnStarted();
			break;
		case state.stopped:
			transcriptOnStopped();
			break;
		case state.timeout:
			transcriptOnTimeout();
			break;
		case state.restart:
			transcriptOnRestart();
			break;
	}
};
$transcript.on('click', function () {
	var action;
	if (transcribing === state.stopped) {
		action = 'start';
		transcriptOnStart();
	}
	else {
		action = 'stop';
		transcriptOnStop();
	}
	$.post('/api/transcription/' + action);
	transcriptAnimate();
});
socket.on('stt conversion', function(data){
	if (!data) return;
	switch (data.cmd) {
		case cmd.data:
			handleData(data.msg);
			break;
		case cmd.error:
			console.error(data.msg);
			break;
		case cmd.debug:
			console.log(data.msg);
			break;
		case cmd.status:
			transcribing = data.msg;
			handleState();
			break;
		case cmd.config:
			refreshSettings(data.msg);
			break;
	}
});

$.get('/api/transcription/state', function (data) {
	transcribing = data.state;
	handleState();
});

/*
* Video
*/
var createVideo = function () {
	if (flvjs.isSupported()) {
		var offtime = 0;
		var offset = 0;
		var config = {
			enableStashBuffer: false
		};
		var mediaDataSource = {
			type: 'flv',
			isLive: true,
			url: 'http://' + location.hostname + ':8000/live/stream.flv'	// Szenario 1
			//url: 'ws://localhost:3000'					// Szenario 2
		};
		var isPlaying = 0;
		var videoElement = document.getElementById('videoElement');
		var playElement = document.getElementById('playElement');
		var seekElement = document.getElementById('seekElement');
		var refreshElement = document.getElementById('refreshElement');
		var mutedElement = document.getElementById('mutedElement');
		var flvPlayer = flvjs.createPlayer(mediaDataSource,config);

		var refresh = function () {
			videoElement.style.display = 'none';
			refreshElement.innerHTML='Refreshing';
			setTimeout(function(){
				flvPlayer.unload();
				flvPlayer.load();
				flvPlayer.play();
				refreshElement.innerHTML='Refresh';
			},600+400*Math.random());
			offtime=0;
			offset=0;
		};

		// Reliability! Check if video still running.
		setInterval(function(){
			if(!videoElement.paused&&isPlaying===videoElement.currentTime) return refresh();
			videoElement.style.display = 'block';
			isPlaying=videoElement.currentTime;
		},2000);

		videoElement.addEventListener('play', function(){
			playElement.innerHTML='Stop';
			offset+=(offtime)?Date.now()-offtime:0;
			offtime=0;
		});

		videoElement.addEventListener('pause', function(){
			playElement.innerHTML='Play';
			offtime=Date.now();
		});

		playElement.addEventListener('click', function(){
			(videoElement.paused)?flvPlayer.play():flvPlayer.pause();
		});

		seekElement.addEventListener('click', function(){
			flvPlayer.currentTime+=offset/1000;
			offset=0;
		});

		refreshElement.addEventListener('click', function(){
			refresh();
		});

		mutedElement.addEventListener('click', function(){
			videoElement.muted=!videoElement.muted;
			mutedElement.innerHTML=(videoElement.muted)?'Unmute':'Mute';
		});

		flvjs.LoggingControl.forceGlobalTag = false;
		flvjs.LoggingControl.enableAll = false;
		flvjs.LoggingControl.enableDebug = false;
		flvjs.LoggingControl.enableVerbose = false;
		flvjs.LoggingControl.enableInfo = false;
		flvjs.LoggingControl.enableWarn = false;
		flvjs.LoggingControl.enableError = false;
		flvjs.LoggingControl.addLogListener(function(ltype,lmsg){console.log(ltype,lmsg);if(ltype==='error')refresh()});

		videoElement.addEventListener('canplay', function(){console.log('I-CANPLAY');});
		videoElement.addEventListener('ended', function(){console.log('I-ENDED');flvPlayer.unload();flvPlayer.load();flvPlayer.play();});

		flvPlayer.attachMediaElement(videoElement);
		flvPlayer.load();
	}
};

createVideo();

/*
* Navigation
*/
$("#nav-tabs").on('show.bs.tab', function(e) {
	$breadcrumb.text($(e.target).text());
});
$("#bc-rt").on('click', function (e) {
	e.preventDefault();
	$('#nav-tabs a[href="#realtime"]').tab('show');
});

/*
* Fullscreen
*/
var fullScreenEvent = function () {
	var map = {
		'exitFullscreen':       'fullscreenchange',
		'webkitExitFullscreen': 'webkitfullscreenchange',
		'mozCancelFullScreen':  'mozfullscreenchange',
		'msExitFullscreen':     'msFullscreenEnabled'
	};
	for ( var exit in map ) {
		if ( exit in document ) {
			return map[ exit ];
		}
	}
	return 'fullscreenchange';
};
var fullScreenEventHandler = function () {
	if (
		document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullscreenElement ||
		document.msFullscreenElement
	) {
		$stw.addClass('livestream-scale');
	}
	else {
		$stw.removeClass('livestream-scale');
	}
};
document.addEventListener(fullScreenEvent(), fullScreenEventHandler);