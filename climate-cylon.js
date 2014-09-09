var fs    = require('fs');
var http  = require('http');
var Cylon = require('cylon');

Cylon.robot({
	connections: [
		{ name: 'tessel', adaptor: 'tessel' },
		{ name: 'tessel_A', adaptor: 'tessel', port: 'A' },
		{ name: 'tessel_B', adaptor: 'tessel', port: 'B' }
	],

	devices: [
		{ name: 'button', driver: 'button', connection: 'tessel' },
		{ name: 'audio', driver: 'audio-vs1053b', connection: 'tessel_A' },
		{ name: 'climate', driver: 'climate-si7005', connection: 'tessel_B' }
	],

	work: function(my) {

		my.climate.on('error', function(err) {
			console.log(err)
		});

		my.audio.on('error', function(err) {
			console.log(err);
		});

		/**
		 * When the 'config' button is pressed, get climate info
		 */
		my.button.on('push', function() {
			my.climate.readTemperature('f', function(err, temp) {
				my.climate.readHumidity(function(err, humid) {
					textToSpeech( 'It is currently ' + (temp - 5).toFixed(0) + ' degrees Fahrenheit, with ' + humid.toFixed(2) + 'percent relative humidity.' );
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

			console.log(url);
			console.log('Getting Audio for: "' + string + '"');

			http.get(url, function(res) {
				console.log(res);
				res.on('data', function(chunk) {
					// stream the audio out
					chunk.pipe(audio.createPlayStream());

					// or write it to a file
					// var file = fs.createWriteStream('climate.mp3');
					// chunk.pipe(file);
					// return file;
				});
			}).on('error', function(err) {
				console.log("Error: " + err.message);
			});

			speakClimate('climate.mp3');
		}

		/**
		 * Plays audio through the headphone output of the Tessel
		 * @param  {String} filename The name of the audio file to be played
		 */
		function speakClimate(filename) {
			console.log('Preparing to play ' + filename);
			my.audio.setVolume(20, function(err) {
				console.log('volume level set');
				if (err) {
					return console.log(err);
				}

				// File based
				// var song = fs.readFileSync(filename);
				// console.log('Playing ' + filename + '...');
				// my.audio.play(song, function(err) {
				// 	if (err) {
				// 		console.log(err);
				// 	} else {
				// 		console.log('Done playing', filename);
				// 	}
				// });

				// Streaming
				my.audio.setOutput('headphone', function(err) {
					fs.createReadStream(filename).pipe(my.audio.createPlayStream());
				});
			});
		}

	}

}).start();