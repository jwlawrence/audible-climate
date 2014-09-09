var fs         = require('fs');
var http       = require('http');
var tessel     = require('tessel');
var audiolib   = require('audio-vs1053b');
var climatelib = require('climate-si7005');

var audio   = audiolib.use(tessel.port['A']);
var climate = climatelib.use(tessel.port['B']);

// Account for errors
climate.on('error', function(err) {
	console.log(err)
});

audio.on('error', function(err) {
	console.log(err);
});

/**
 * When the 'config' button is pressed, get climate info
 */
climate.on('ready', function () {
   	tessel.button.once('press', function() {
		climate.readTemperature('f', function(err, temp) {
			climate.readHumidity(function(err, humid) {
				textToSpeech( 'It is currently ' + (temp - 5).toFixed(0) + ' degrees Fahrenheit, with ' + humid.toFixed(2) + 'percent relative humidity.' );
			});
		});
	});
});

/**
 * Use the tts API to convert text to an audio file
 * @param  {String} string The text to convert to audio
 * @return {Stream}        The streaming audio file
 */
function textToSpeech(string) {
	var encodedText = encodeURIComponent(string);
	var url = 'http://tts-api.com/tts.mp3?q=' + encodedText;
	console.log('Getting audio from: "' + url + '"');

	// Either return the stream of data from the http res
	// or return the filename created in RAM

	// http.get(url, function(res) {
	// 	console.log(res);

	// 	res.on('data', function(chunk) {
	// 		console.log(chunk);

	// 		// stream the audio out
	// 		chunk.pipe(audio.createPlayStream());

	// 		// or write it to a file
	// 		// var file = fs.createWriteStream('climate.mp3');
	// 		// chunk.pipe(file);
	// 	});

	// }).on('error', function(err) {
	// 	console.log("Error: " + err.message);
	// }).end();

	speakClimate('climate.mp3');
}

/**
 * Plays audio through the headphone output of the Tessel
 * @param  {String} filename The name of the audio file to be played
 */
function speakClimate(filename) {
	audio.on('ready', function () {
		if (err) {
			return console.log(err);
		}

		console.log('Preparing to play ' + filename);

		audio.setVolume(20, function(err) {
			if (err) {
				return console.log(err);
			}

			console.log('volume level set');

			// Streaming
			audio.setOutput('headphone', function(err) {
				fs.createReadStream(filename).pipe(audio.createPlayStream());
			});

			// File based
			// var song = fs.readFileSync(filename);
			// console.log('Playing ' + filename + '...');
			// audio.play(song, function(err) {
			// 	if (err) {
			// 		console.log(err);
			// 	} else {
			// 		console.log('Done playing', filename);
			// 	}
			// });
		});
	});
}